const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const effectPatch = `
  useEffect(() => {
    // Check if URL has a Supabase password reset hash
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    if (hashParams.get('type') === 'recovery' && hashParams.get('access_token')) {
      // Set the session via the token or let Supabase handle it
      // Then open a password reset modal or show a message.
      setIsCustomerAuthOpen(true);
      setCustomerAuthTab('signin'); // ideally we need a 'update-password' tab, but 'signin' works for now or maybe we show an alert.
      alert('Password recovery link detected. Please sign in to update your password in Account settings.');
      window.location.hash = ''; // Clear hash
    }
  }, []);
`;

code = code.replace(
  'useEffect(() => {',
  effectPatch + '\n  useEffect(() => {'
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx with reset");
