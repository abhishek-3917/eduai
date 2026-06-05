import { Request, Response, NextFunction } from 'express';

export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing: string[] = [];
    
    for (const f of fields) {
      if (req.body[f] === undefined || req.body[f] === null || req.body[f] === '') {
        missing.push(f);
      }
    }
    
    if (missing.length > 0) {
      return res.status(400).json({ 
        message: `Validation failed. Missing required fields: [${missing.join(', ')}]` 
      });
    }
    
    // Check email formatting if present
    if (req.body.email && typeof req.body.email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ message: 'Validation failed. Invalid email format.' });
      }
    }
    
    next();
  };
};
