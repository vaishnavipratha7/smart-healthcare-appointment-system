document.querySelector('form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
      const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
          alert(data.message);
          window.location.href = '/login.html';
      } else {
          alert(data.error);
      }
  } catch (err) {
      alert('Error signing up.');
      console.error(err);
  }
});