import { deleteUserCascade } from '../utils/deleteUser.js';


router.delete('/me', protect, async (req, res) => {
  try {
    await deleteUserCascade(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});