import jwt from 'jsonwebtoken';

export const SECRET_KEY = 'webmessage';

export const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
      return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
          return res.status(401).json({ message: 'Failed to authenticate token' });
      }
      req.user = decoded;
      req.exp = decoded.exp
      next();
  });
};
