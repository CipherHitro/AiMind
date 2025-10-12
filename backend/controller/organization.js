const Organization = require('../models/organization');
const User = require('../models/user');

// Get all organizations for a user
async function getUserOrganizations(req, res) {
  try {
    const user = req.user;
    
    // Populate organization details
    const userWithOrgs = await User.findById(user._id)
      .populate({
        path: 'organizations.orgId',
        select: 'name owner members isDefault createdAt'
      })
      .populate('activeOrganization');

    const orgsData = userWithOrgs.organizations.map(org => ({
      _id: org.orgId._id,
      name: org.orgId.name,
      role: org.role,
      status: org.status,
      isDefault: org.orgId.isDefault,
      memberCount: org.orgId.members.length,
      isActive: userWithOrgs.activeOrganization?.toString() === org.orgId._id.toString()
    }));

    return res.status(200).json({ organizations: orgsData });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return res.status(500).json({ message: 'Error fetching organizations' });
  }
}

// Get organization details
async function getOrganizationDetails(req, res) {
  try {
    const { orgId } = req.params;
    const user = req.user;

    // Check if user is a member of this organization
    const userOrg = user.organizations.find(org => org.orgId.toString() === orgId);
    
    if (!userOrg) {
      return res.status(403).json({ message: 'You are not a member of this organization' });
    }

    const organization = await Organization.findById(orgId)
      .populate({
        path: 'members.userId',
        select: 'username email fullName picture'
      })
      .populate({
        path: 'owner',
        select: 'username email fullName picture'
      })
      .populate({
        path: 'invitations.invitedBy',
        select: 'username fullName'
      });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Format response
    const orgData = {
      _id: organization._id,
      name: organization.name,
      owner: organization.owner,
      isDefault: organization.isDefault,
      userRole: userOrg.role,
      members: organization.members.map(member => ({
        _id: member.userId._id,
        username: member.userId.username,
        email: member.userId.email,
        fullName: member.userId.fullName,
        picture: member.userId.picture,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt
      })),
      invitations: userOrg.role === 'admin' ? organization.invitations.filter(inv => inv.status === 'pending').map(inv => ({
        email: inv.email,
        role: inv.role,
        invitedBy: inv.invitedBy,
        invitedAt: inv.invitedAt,
        expiresAt: inv.expiresAt
      })) : [],
      createdAt: organization.createdAt
    };

    return res.status(200).json({ organization: orgData });
  } catch (error) {
    console.error('Error fetching organization details:', error);
    return res.status(500).json({ message: 'Error fetching organization details' });
  }
}

// Create new organization
async function createOrganization(req, res) {
  try {
    const { name, inviteEmails } = req.body;
    const user = req.user;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Organization name is required' });
    }

    // Create organization
    const organization = await Organization.create({
      name: name.trim(),
      owner: user._id,
      members: [
        {
          userId: user._id,
          role: 'admin',
          status: 'active',
          joinedAt: new Date()
        }
      ],
      invitations: inviteEmails && inviteEmails.length > 0 ? inviteEmails.map(invite => ({
        email: invite.email.trim().toLowerCase(),
        invitedBy: user._id,
        role: invite.role || 'member',
        status: 'pending',
        invitedAt: new Date()
      })) : [],
      isDefault: false
    });

    // Add organization to user's organizations
    user.organizations.push({
      orgId: organization._id,
      role: 'admin',
      status: 'active'
    });

    // Set as active organization if user doesn't have one
    if (!user.activeOrganization) {
      user.activeOrganization = organization._id;
    }

    await user.save();

    console.log('Organization created:', organization.name);
    return res.status(201).json({ 
      message: 'Organization created successfully',
      organization: {
        _id: organization._id,
        name: organization.name,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return res.status(500).json({ message: 'Error creating organization' });
  }
}

// Invite member to organization
async function inviteMember(req, res) {
  try {
    const { orgId } = req.params;
    const { email, role } = req.body;
    const user = req.user;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user is admin of this organization
    const userOrg = user.organizations.find(org => 
      org.orgId.toString() === orgId && org.role === 'admin'
    );

    if (!userOrg) {
      return res.status(403).json({ message: 'Only admins can invite members' });
    }

    const organization = await Organization.findById(orgId);

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const emailLower = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: emailLower });
    
    if (existingUser) {
      // Check if already a member
      const isMember = organization.members.some(m => 
        m.userId.toString() === existingUser._id.toString()
      );

      if (isMember) {
        return res.status(400).json({ message: 'User is already a member' });
      }

      // Add as member directly
      organization.members.push({
        userId: existingUser._id,
        role: role || 'member',
        status: 'active',
        joinedAt: new Date()
      });

      existingUser.organizations.push({
        orgId: organization._id,
        role: role || 'member',
        status: 'active'
      });

      await organization.save();
      await existingUser.save();

      return res.status(200).json({ 
        message: 'Member added successfully',
        member: {
          username: existingUser.username,
          email: existingUser.email,
          role: role || 'member'
        }
      });
    } else {
      // Check if already invited
      const existingInvite = organization.invitations.find(inv => 
        inv.email === emailLower && inv.status === 'pending'
      );

      if (existingInvite) {
        return res.status(400).json({ message: 'Invitation already sent to this email' });
      }

      // Add invitation
      organization.invitations.push({
        email: emailLower,
        invitedBy: user._id,
        role: role || 'member',
        status: 'pending',
        invitedAt: new Date()
      });

      await organization.save();

      return res.status(200).json({ 
        message: 'Invitation sent successfully',
        invitation: {
          email: emailLower,
          role: role || 'member'
        }
      });
    }
  } catch (error) {
    console.error('Error inviting member:', error);
    return res.status(500).json({ message: 'Error inviting member' });
  }
}

// Update member role
async function updateMemberRole(req, res) {
  try {
    const { orgId, memberId } = req.params;
    const { role } = req.body;
    const user = req.user;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user is admin
    const userOrg = user.organizations.find(org => 
      org.orgId.toString() === orgId && org.role === 'admin'
    );

    if (!userOrg) {
      return res.status(403).json({ message: 'Only admins can update member roles' });
    }

    const organization = await Organization.findById(orgId);

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Can't change owner's role
    if (organization.owner.toString() === memberId) {
      return res.status(400).json({ message: 'Cannot change owner role' });
    }

    // Update in organization
    const member = organization.members.find(m => m.userId.toString() === memberId);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    member.role = role;
    await organization.save();

    // Update in user's organizations
    const memberUser = await User.findById(memberId);
    const memberOrgRef = memberUser.organizations.find(org => org.orgId.toString() === orgId);
    
    if (memberOrgRef) {
      memberOrgRef.role = role;
      await memberUser.save();
    }

    return res.status(200).json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error('Error updating member role:', error);
    return res.status(500).json({ message: 'Error updating member role' });
  }
}

// Remove member from organization
async function removeMember(req, res) {
  try {
    const { orgId, memberId } = req.params;
    const user = req.user;

    // Check if user is admin
    const userOrg = user.organizations.find(org => 
      org.orgId.toString() === orgId && org.role === 'admin'
    );

    if (!userOrg) {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    const organization = await Organization.findById(orgId);

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Can't remove owner
    if (organization.owner.toString() === memberId) {
      return res.status(400).json({ message: 'Cannot remove organization owner' });
    }

    // Remove from organization
    organization.members = organization.members.filter(m => 
      m.userId.toString() !== memberId
    );
    await organization.save();

    // Remove from user's organizations
    const memberUser = await User.findById(memberId);
    if (memberUser) {
      memberUser.organizations = memberUser.organizations.filter(org => 
        org.orgId.toString() !== orgId
      );

      // If this was their active organization, set to their first org or null
      if (memberUser.activeOrganization?.toString() === orgId) {
        memberUser.activeOrganization = memberUser.organizations.length > 0 
          ? memberUser.organizations[0].orgId 
          : null;
      }

      await memberUser.save();
    }

    return res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    return res.status(500).json({ message: 'Error removing member' });
  }
}

// Switch active organization
async function switchOrganization(req, res) {
  try {
    const { orgId } = req.params;
    const user = req.user;

    // Check if user is member of this organization
    const userOrg = user.organizations.find(org => org.orgId.toString() === orgId);

    if (!userOrg) {
      return res.status(403).json({ message: 'You are not a member of this organization' });
    }

    user.activeOrganization = orgId;
    await user.save();

    return res.status(200).json({ 
      message: 'Active organization switched successfully',
      activeOrganization: orgId
    });
  } catch (error) {
    console.error('Error switching organization:', error);
    return res.status(500).json({ message: 'Error switching organization' });
  }
}

module.exports = {
  getUserOrganizations,
  getOrganizationDetails,
  createOrganization,
  inviteMember,
  updateMemberRole,
  removeMember,
  switchOrganization
};
