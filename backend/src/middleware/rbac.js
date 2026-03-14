// Role hierarchy for reference:
// admin            → full access to everything
// inventory_manager → validate/approve operations, manage products
// warehouse_staff  → create receipts, transfers, adjustments
// dispatcher       → manage deliveries only

const ROLES = {
  ADMIN: 'admin',
  INVENTORY_MANAGER: 'inventory_manager',
  WAREHOUSE_STAFF: 'warehouse_staff',
  DISPATCHER: 'dispatcher',
};

// authorize(...roles) — pass allowed roles as arguments
// Usage: router.delete('/:id', protect, authorize('admin'), controller)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = { authorize, ROLES };