const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. No user found.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

const checkOwnership = (Model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resource = await Model.findById(req.params[paramName]);
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Check if user owns the resource
      const ownerId = resource.owner || resource.user || resource.userId;
      if (ownerId && ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only access your own resources.' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };
};

const checkPetOwnership = async (req, res, next) => {
  try {
    const Pet = require('../models/Pet');
    const pet = await Pet.findById(req.params.id);
    
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    if (pet.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own pets.' });
    }

    req.pet = pet;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { authorize, checkOwnership, checkPetOwnership };