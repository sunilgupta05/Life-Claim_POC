const poolSelectionService = require('../services/poolSelectionService');

const userRoles = (req) => {
    const fromUser = Array.isArray(req.user?.roles) ? req.user.roles : [];
    const fromKeycloak = Array.isArray(req.kauth?.grant?.access_token?.content?.realm_access?.roles)
        ? req.kauth.grant.access_token.content.realm_access.roles
        : [];
    return Array.from(new Set([...fromUser, ...fromKeycloak]));
};
const POOL_ROLES = new Set(['Assessor', 'Verifier']);

const getSelectedPool = async (req, res) => {
    const { role } = req.body;

    if (!role) {
        return res.status(400).json({ message: 'Role is required' });
    }
    if (!POOL_ROLES.has(role)) {
        return res.status(400).json({ message: 'Invalid pool role. Allowed values: Assessor, Verifier.' });
    }

    const roles = userRoles(req);
    if (!roles.includes(role)) {
        return res.status(403).json({
            message: 'You may only request a pool for a role assigned to your account.',
        });
    }

    try {
        const poolData = await poolSelectionService.getPoolDataService(role);
        res.json(poolData);
    } catch (error) {
        console.error('Error fetching pool data:', error);
        res.status(500).json({ message: 'Error fetching pool data' });
    }
};

const updateAssignedUser = async (req, res) => {
    const claimNumber = req.params.claimNumber;
    const { checkboxValue, LoggedUser, role } = req.body;
    if (!role || !POOL_ROLES.has(role)) {
        return res.status(400).json({ message: 'Invalid pool role. Allowed values: Assessor, Verifier.' });
    }
    const roles = userRoles(req);

    if (!roles.includes(role)) {
        return res.status(403).json({ message: 'Invalid role for this action.' });
    }

    const me = String(
        req.user?.username ||
        req.kauth?.grant?.access_token?.content?.preferred_username ||
        ''
    ).trim();
    const assignee = String(LoggedUser || '').trim();
    if (!me || assignee.toLowerCase() !== me.toLowerCase()) {
        return res.status(403).json({
            message: 'You may only assign a claim to yourself.',
        });
    }

    try {
        if (checkboxValue) {
            await poolSelectionService.updateAssignedUser(claimNumber, LoggedUser, role);
            return res.status(200).json({ message: 'Case Assigned to you.' });
        }
        return res.status(400).json({ message: 'Checkbox not ticked.' });
    } catch (error) {
        console.error('Error updating AssignedUser:', error);
        res.status(500).json({ message: 'Error updating AssignedUser' });
    }
};

module.exports = {
    getSelectedPool,
    updateAssignedUser
};
