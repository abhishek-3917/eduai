import os
import re
import sys
import time
import urllib.request
import urllib.parse
import json

def read_env_gemini_key():
    try:
        with open('.env', 'r') as f:
            content = f.read()
            match = re.search(r'GEMINI_API_KEY\s*=\s*(.+)', content)
            if match:
                return match.group(1).strip()
    except Exception:
        pass
    return None

def parse_db_url(url):
    pattern = r'postgres://(?P<user>[^:]+):(?P<password>[^@]+)@(?P<host>[^:/]+)(:(?P<port>\d+))?/(?P<name>[^?#\s]+)'
    match = re.match(pattern, url)
    if not match:
        raise ValueError("Invalid PostgreSQL connection string format.")
    
    gd = match.groupdict()
    return {
        'host': gd['host'],
        'port': gd['port'] or '5432',
        'user': gd['user'],
        'password': gd['password'],
        'name': gd['name']
    }

def request_koyeb(url, method, token, data=None):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'User-Agent': 'EduAI-Cloud-Setup/1.0'
    }
    
    req_body = None
    if data:
        req_body = json.dumps(data).encode('utf-8')
        
    req = urllib.request.Request(url, headers=headers, method=method, data=req_body)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        try:
            parsed_err = json.loads(err_msg)
            message = parsed_err.get('message', err_msg)
        except Exception:
            message = err_msg
        raise RuntimeError(f"HTTP {e.code}: {message}")
    except Exception as e:
        raise RuntimeError(f"Request failed: {str(e)}")

def main():
    print("=========================================")
    print("    EduAI Automated Free Cloud Setup     ")
    print("=========================================\n")
    
    # 1. Inputs
    gemini_key = read_env_gemini_key()
    if not gemini_key:
        print("[-] Error: GEMINI_API_KEY not found in local .env file.")
        gemini_key = input("Please enter your Google Gemini API Key: ").strip()
        if not gemini_key:
            print("[-] API Key is required. Exiting.")
            sys.exit(1)

    koyeb_token = input("Enter your Koyeb API Token (from https://app.koyeb.com/settings/api-keys): ").strip()
    if not koyeb_token:
        print("[-] Koyeb API Token is required. Exiting.")
        sys.exit(1)
        
    db_url = input("Enter your Neon PostgreSQL Database URL: ").strip()
    if not db_url:
        print("[-] Neon Database URL is required. Exiting.")
        sys.exit(1)
        
    try:
        db_config = parse_db_url(db_url)
    except Exception as e:
        print(f"[-] Database URL parsing failed: {e}")
        sys.exit(1)

    print("\n[+] Inputs validated. Connecting to Koyeb API...")

    # 2. Create/Verify App
    try:
        print("[+] Verifying Koyeb App 'eduai'...")
        app_list = request_koyeb("https://api.koyeb.com/v1/apps", "GET", koyeb_token)
        app_exists = False
        for app in app_list.get('apps', []):
            if app.get('name') == 'eduai':
                app_exists = True
                print("[+] App 'eduai' already exists.")
                break
                
        if not app_exists:
            request_koyeb("https://api.koyeb.com/v1/apps", "POST", koyeb_token, {"name": "eduai"})
            print("[+] App 'eduai' created successfully.")
    except Exception as e:
        print(f"[-] App verification failed: {e}")
        sys.exit(1)

    # 3. Create/Verify Service (deploy both Express & Python in one single service)
    service_name = "backend"
    try:
        print(f"[+] Setting up unified service '{service_name}' on Koyeb...")
        services = request_koyeb("https://api.koyeb.com/v1/services?app_id=eduai", "GET", koyeb_token)
        service_exists = False
        for s in services.get('services', []):
            if s.get('name') == service_name:
                service_exists = True
                print(f"[+] Service '{service_name}' already exists.")
                break

        if not service_exists:
            git_repo = "github.com/abhishek-3917/eduai"
            payload = {
                "app_id": "eduai",
                "definition": {
                    "name": service_name,
                    "type": "WEB",
                    "routes": [{"path": "/", "port": 5000}],
                    "ports": [{"port": 5000, "protocol": "HTTP"}],
                    "env": [
                        {"key": "PORT", "value": "5000"},
                        {"key": "NODE_ENV", "value": "production"},
                        {"key": "JWT_SECRET", "value": "your_super_secret_jwt_key_change_in_production"},
                        {"key": "GEMINI_API_KEY", "value": gemini_key},
                        {"key": "DB_HOST", "value": db_config['host']},
                        {"key": "DB_PORT", "value": db_config['port']},
                        {"key": "DB_USER", "value": db_config['user']},
                        {"key": "DB_PASSWORD", "value": db_config['password']},
                        {"key": "DB_NAME", "value": db_config['name']}
                    ],
                    "regions": ["fra"],
                    "instance_types": ["nano"],
                    "git": {
                        "repository": git_repo,
                        "branch": "main",
                        "docker": {
                            "dockerfile": "Dockerfile.prod"
                        }
                    }
                }
            }
            request_koyeb("https://api.koyeb.com/v1/services", "POST", koyeb_token, payload)
            print("[+] Unified Service deployment triggered successfully.")
        else:
            print("[*] Service already exists. Deployments are triggered automatically on Git push.")
    except Exception as e:
        print(f"[-] Service creation failed: {e}")
        sys.exit(1)

    # 4. Display Status Info
    try:
        app_details = request_koyeb("https://api.koyeb.com/v1/apps/eduai", "GET", koyeb_token)
        domain_name = app_details.get('app', {}).get('domain')
        print("\n=========================================")
        print("          DEPLOYMENT STATUS              ")
        print("=========================================")
        print(f"[+] Database: Neon PostgreSQL ({db_config['host']})")
        print(f"[+] App: Deployed on Koyeb Free Nano Tier")
        if domain_name:
            print(f"[+] Public Endpoint: https://{domain_name}")
            print(f"[+] Set 'VITE_API_URL' in Netlify to: https://{domain_name}/api")
        print("=========================================\n")
    except Exception:
        print("\n[+] Done. Manage your service in the Koyeb console: https://app.koyeb.com/apps/eduai")

if __name__ == "__main__":
    main()
