import React, { useState } from 'react';

function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '' });

  const validateEmail = (email) => {
    // Basic email regex for validation
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let valid = true;
    const newErrors = { name: '', email: '' };

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
      valid = false;
    }

    setErrors(newErrors);

    if (valid) {
      // Handle successful signup here
      setSubmitted(true);
    } else {
      setSubmitted(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'gray', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '90%', maxWidth: '400px', padding: '20px', boxSizing: 'border-box' }}>
        <h1 style={{ color: 'green', textAlign: 'center', marginBottom: '20px' }}>News Today</h1>
        {submitted ? (
          <div style={{ textAlign: 'center', fontSize: '1.2em', color: 'green', marginBottom: '20px' }}>
            Signup successful! Welcome to News Today.
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label htmlFor="name" style={{ fontWeight: 'bold' }}>Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  padding: '10px',
                  fontSize: '1em',
                  width: '100%',
                  boxSizing: 'border-box',
                  border: errors.name ? '2px solid red' : '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
              {errors.name && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.name}</span>}

              <label htmlFor="email" style={{ fontWeight: 'bold' }}>Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  padding: '10px',
                  fontSize: '1em',
                  width: '100%',
                  boxSizing: 'border-box',
                  border: errors.email ? '2px solid red' : '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
              {errors.email && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.email}</span>}

              <button
                type="submit"
                style={{
                  padding: '10px',
                  fontSize: '1em',
                  backgroundColor: 'green',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px',
                }}
              >
                Sign Up
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default SignupPage;