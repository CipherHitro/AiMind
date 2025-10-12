const express = require('express');
const router = express.Router();
const {
  getUserOrganizations,
  getOrganizationDetails,
  createOrganization,
  inviteMember,
  updateMemberRole,
  removeMember,
  switchOrganization
} = require('../controller/organization');
const { authenticateUser } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticateUser);

// Get all user's organizations
router.get('/', getUserOrganizations);

// Create new organization
router.post('/create', createOrganization);

// Get organization details
router.get('/:orgId', getOrganizationDetails);

// Switch active organization
router.post('/:orgId/switch', switchOrganization);

// Invite member to organization
router.post('/:orgId/invite', inviteMember);

// Update member role
router.patch('/:orgId/members/:memberId/role', updateMemberRole);

// Remove member from organization
router.delete('/:orgId/members/:memberId', removeMember);

module.exports = router;
