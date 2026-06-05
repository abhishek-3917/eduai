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
    # Format: postgres://user:password@host:port/dbname
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
    print("    EduAI Automated Cloud Setup (Koyeb)   ")
    print("=========================================\n")
    
    # 1. Inputs & Local Config Verification
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

    print("\n[+] Verification successful. Connecting to Koyeb API...")

    # 2. Create App
    try:
        print("[+] Creating Koyeb App 'eduai'...")
        # Check if app already exists, or create it
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
        print(f"[-] App creation failed: {e}")
        sys.exit(1)

    # 3. Create AI Service
    ai_service_name = "ai-service"
    ai_service_url = None
    try:
        print(f"[+] Launching AI service '{ai_service_name}' on Koyeb...")
        # Check if service exists
        services = request_koyeb("https://api.koyeb.com/v1/services?app_id=eduai", "GET", koyeb_token)
        service_exists = False
        for s in services.get('services', []):
            if s.get('name') == ai_service_name:
                service_exists = True
                print(f"[+] Service '{ai_service_name}' already exists.")
                break

        if not service_exists:
            # Get latest git commit to identify repository automatically
            git_repo = "github.com/abhishek-3917/eduai"
            payload = {
                "app_id": "eduai",
                "definition": {
                    "name": ai_service_name,
                    "type": "WEB",
                    "routes": [{"path": "/", "port": 8000}],
                    "ports": [{"port": 8000, "protocol": "HTTP"}],
                    "env": [
                        {"key": "PORT", "value": "8000"},
                        {"key": "GEMINI_API_KEY", "value": gemini_key}
                    ],
                    "regions": ["fra"],
                    "instance_types": ["nano"],
                    "git": {
                        "repository": git_repo,
                        "branch": "main",
                        "workdir": "ai-service",
                        "docker": {
                            "dockerfile": "Dockerfile"
                        }
                    }
                }
            }
            request_koyeb("https://api.koyeb.com/v1/services", "POST", koyeb_token, payload)
            print("[+] AI Service deployment triggered successfully.")
    except Exception as e:
        print(f"[-] AI Service creation failed: {e}")
        sys.exit(1)

    # 4. Wait for AI Service URL
    print("[+] Polling Koyeb for AI service public endpoint URL...")
    for _ in range(30):
        try:
            services = request_koyeb("https://api.koyeb.com/v1/services?app_id=eduai", "GET", koyeb_token)
            for s in services.get('services', []):
                if s.get('name') == ai_service_name:
                    status = s.get('status')
                    # Try to fetch global domain
                    domains = s.get('routes', [])
                    if domains:
                        # Construct public Koyeb URL format: https://<service_name>-<app_name>-<org_name>.koyeb.app
                        # Or extract from details if available
                        pass
                    
                    # Alternative: query Koyeb deployments to find the external URL
                    deployments = request_koyeb("https://api.koyeb.com/v1/deployments?service_id=" + s.get('id'), "GET", koyeb_token)
                    for d in deployments.get('deployments', []):
                        if d.get('status') in ['ACTIVE', 'STARTING', 'PROVISIONING']:
                            # Koyeb appends app and service domain
                            # Fetch domains of the app
                            app_details = request_koyeb("https://api.koyeb.com/v1/apps/eduai", "GET", koyeb_token)
                            domain_name = app_details.get('app', {}).get('domain')
                            if domain_name:
                                ai_service_url = f"https://{domain_name}"
                                break
            if ai_service_url:
                print(f"[+] Found AI Service endpoint: {ai_service_url}")
                break
        except Exception as e:
            print(f"[*] Polling warning: {e}")
        time.sleep(5)
        
    if not ai_service_url:
        print("[-] Could not retrieve public domain for AI service yet. Using default placeholder.")
        # Fallback to general slug if app domain fetch failed
        ai_service_url = "https://eduai-ai-service.koyeb.app"

    # 5. Create Backend Service
    backend_service_name = "backend"
    backend_url = None
    try:
        print(f"[+] Launching Express Backend gateway '{backend_service_name}' on Koyeb...")
        services = request_koyeb("https://api.koyeb.com/v1/services?app_id=eduai", "GET", koyeb_token)
        service_exists = False
        for s in services.get('services', []):
            if s.get('name') == backend_service_name:
                service_exists = True
                print(f"[+] Service '{backend_service_name}' already exists.")
                break

        if not service_exists:
            git_repo = "github.com/abhishek-3917/eduai"
            payload = {
                "app_id": "eduai",
                "definition": {
                    "name": backend_service_name,
                    "type": "WEB",
                    "routes": [{"path": "/", "port": 5000}],
                    "ports": [{"port": 5000, "protocol": "HTTP"}],
                    "env": [
                        {"key": "PORT", "value": "5000"},
                        {"key": "NODE_ENV", "value": "production"},
                        {"key": "JWT_SECRET", "value": "your_super_secret_jwt_key_change_in_production"},
                        {"key": "DB_HOST", "value": db_config['host']},
                        {"key": "DB_PORT", "value": db_config['port']},
                        {"key": "DB_USER", "value": db_config['user']},
                        {"key": "DB_PASSWORD", "value": db_config['password']},
                        {"key": "DB_NAME", "value": db_config['name']},
                        {"key": "AI_SERVICE_URL", "value": ai_service_url}
                    ],
                    "regions": ["fra"],
                    "instance_types": ["nano"],
                    "git": {
                        "repository": git_repo,
                        "branch": "main",
                        "workdir": "backend",
                        "docker": {
                            "dockerfile": "Dockerfile"
                        }
                    }
                }
            }
            request_koyeb("https://api.koyeb.com/v1/services", "POST", koyeb_token, payload)
            print("[+] Backend Service deployment triggered successfully.")
    except Exception as e:
        print(f"[-] Backend Service creation failed: {e}")
        sys.exit(1)

    # Fetch Backend URL
    time.sleep(3)
    try:
        app_details = request_koyeb("https://api.koyeb.com/v1/apps/eduai", "GET", koyeb_token)
        domain_name = app_details.get('app', {}).get('domain')
        # Koyeb assigns domain names per service if they are in the same app
        # Wait, the app domain maps to the services. Usually: service_name-app_name-org_name.koyeb.app
        # Let's print out the general domain instructions
        print("\n=========================================")
        print("          DEPLOYMENT STATUS              ")
        print("=========================================")
        print(f"[+] Database: Neon PostgreSQL ({db_config['host']})")
        print(f"[+] AI Service: Deployed on Koyeb (running on port 8000)")
        print(f"[+] Backend Gateway: Deployed on Koyeb (running on port 5000)")
        print(f"\n[!] Note: You can view your live services and their exact domains in your Koyeb Console:")
        print("    https://app.koyeb.com/apps/eduai")
        print("\n[+] Once you retrieve the public domain for the 'backend' service, configure it in Netlify as 'VITE_API_URL'.")
        print("=========================================\n")
    except Exception as e:
        print(f"[+] Done. Visit the Koyeb console to manage your services: https://app.koyeb.com/apps/eduai")

if __name__ == "__main__":
    main()
