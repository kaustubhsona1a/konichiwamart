const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const updatedEffect = `
  useEffect(() => {
    // Check if URL has a Supabase password reset hash
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    if (hashParams.get('type') === 'recovery' && hashParams.get('access_token')) {
      window.location.hash = ''; // Clear hash
      const newPassword = prompt('Password Recovery: Please enter your new password.');
      if (newPassword && newPassword.length >= 6) {
        // We will call the backend or supabase directly to update it.
        const client = getSupabaseClient();
        if (client) {
          client.auth.updateUser({ password: newPassword })
            .then(({ error }) => {
              if (error) {
                alert('Failed to update password: ' + error.message);
              } else {
                alert('Password updated successfully! You can now sign in.');
                setIsCustomerAuthOpen(true);
                setCustomerAuthTab('signin');
              }
            });
        }
      } else if (newPassword) {
        alert('Password must be at least 6 characters.');
      }
    }
  }, []);
`;

code = code.replace(
  /useEffect\(\(\) => \{\n\s+\/\/ Check if URL has a Supabase password reset hash[\s\S]*?\}, \[\]\);/,
  updatedEffect.trim()
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx with direct password update");
