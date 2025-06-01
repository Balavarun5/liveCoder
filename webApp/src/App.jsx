import React, { useState, useRef, useEffect } from 'react';
import { CodeBlock, dracula } from 'react-code-blocks';
import html2canvas from 'html2canvas';
import CodeToggle from './components/CodeToggle';
import codeString from './components/CodeToggle.jsx?raw';

// Store test cases string at module scope
let currentTestCasesString = '';

function App() {
  const [showCode, setShowCode] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [isCheckingServer, setIsCheckingServer] = useState(true);
  const [requirement, setRequirement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isOpenAIServerConnected, setIsOpenAIServerConnected] = useState(false);
  const [testCases, setTestCases] = useState([]);
  const [evaluationResult, setEvaluationResult] = useState('');
  const [concatenatedTestCases, setConcatenatedTestCases] = useState('');
  const codeToggleRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // Reset CodeToggle.jsx on page load
  useEffect(() => {
    const resetCodeToggle = async () => {
      const dummyComponent = `import React from 'react';

function CodeToggle() {
  return (
    <div>
      Initial Component
    </div>
  );
}

export default CodeToggle;`;

      try {
        const response = await fetch('http://localhost:3001/api/write-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: 'webApp/src/components/CodeToggle.jsx',
            content: dummyComponent
          })
        });

        if (response.ok) {
          console.log('Reset CodeToggle.jsx to initial state');
        }
      } catch (error) {
        console.error('Error resetting CodeToggle.jsx:', error);
      }
    };

    resetCodeToggle();
  }, []); // Empty dependency array means this runs once on mount

  // Function to add a new test case
  const addTestCase = (text) => {
    const newId = testCases.length > 0 ? Math.max(...testCases.map(tc => tc.id)) + 1 : 1;
    setTestCases([...testCases, { id: newId, text, completed: false }]);
    return newId;
  };

  // Function to delete a test case
  const deleteTestCase = (id) => {
    setTestCases(testCases.filter(tc => tc.id !== id));
  };

  // Function to toggle test case completion
  const toggleTestCase = (id) => {
    setTestCases(testCases.map(tc => 
      tc.id === id ? { ...tc, completed: !tc.completed } : tc
    ));
  };

  // Check if backend server is running
  const checkServer = async () => {
    try {
      setIsCheckingServer(true);
      const response = await fetch('http://localhost:3001/api/test', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      console.log('Backend server status:', data.status);
      setIsServerConnected(true);
      setIsCheckingServer(false);
      setSaveStatus('');
      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    } catch (error) {
      console.error('Backend server not reachable:', error);
      setIsServerConnected(false);
      setIsCheckingServer(false);
      setSaveStatus('Error: Backend server not connected. Retrying...');
      // Retry after 5 seconds
      retryTimeoutRef.current = setTimeout(checkServer, 5000);
    }
  };

  // Check if OpenAI backend server is running
  const checkOpenAIServer = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      if (response.ok) {
        setIsOpenAIServerConnected(true);
        setSubmitError('');
      } else {
        setIsOpenAIServerConnected(false);
        setSubmitError('OpenAI Server is not responding correctly');
      }
    } catch (error) {
      console.error('OpenAI server not reachable:', error);
      setIsOpenAIServerConnected(false);
      setSubmitError('OpenAI Server is not running. Please start the Python backend server on port 8000.');
    }
  };

  useEffect(() => {
    checkServer();
    checkOpenAIServer();
    // Cleanup function to clear timeout on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const takeScreenshotProgrammatically = async (showCodeView = false) => {
    if (!isServerConnected) {
      console.error('Backend server not connected');
      return { success: false, error: 'Backend server not connected' };
    }

    try {
      // Temporarily set the view if needed
      const originalView = showCode;
      if (showCodeView !== showCode) {
        setShowCode(showCodeView);
        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const elementToCapture = showCodeView ? 
        document.querySelector('.react-code-blocks-container') : 
        codeToggleRef.current;

      if (!elementToCapture) {
        throw new Error('No element to capture');
      }

      const canvas = await html2canvas(elementToCapture, {
        backgroundColor: null,
        scale: 2,
        logging: true,
        useCORS: true
      });

      const imageData = canvas.toDataURL('image/png');
      
      const response = await fetch('http://localhost:3001/api/save-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ imageData }),
      });

      const result = await response.json();

      // Restore original view if it was changed
      if (showCodeView !== originalView) {
        setShowCode(originalView);
      }

      if (result.success) {
        return { success: true, path: result.path };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error('Screenshot error:', error);
      return { success: false, error: error.message };
    }
  };

  const takeScreenshot = async () => {
    if (!isServerConnected) {
      setSaveStatus('Error: Backend server not connected. Please start the backend server.');
      checkServer();
      return;
    }

    try {
      setSaveStatus('Capturing screenshot...');
      const result = await takeScreenshotProgrammatically(showCode);
      
      if (result.success) {
        setSaveStatus(`Screenshot saved successfully!`);
        
        // Use the module-scoped variable for evaluation
        try {
          console.log('Using test cases for evaluation:', currentTestCasesString);
          const evaluationResponse = await fetch(`http://127.0.0.1:8000/evaluate_image_with_prompt?prompt=${encodeURIComponent(currentTestCasesString)}&image_path=${encodeURIComponent(result.path)}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          });

          if (evaluationResponse.ok) {
            const evaluationData = await evaluationResponse.json();
            setEvaluationResult(evaluationData.response);
          } else {
            setEvaluationResult('Failed to evaluate the screenshot.');
          }
        } catch (evalError) {
          console.error('Evaluation error:', evalError);
          setEvaluationResult('Error evaluating the screenshot: ' + evalError.message);
        }
      } else {
        setSaveStatus(`Failed to save screenshot`);
      }
    } catch (error) {
      console.error('Screenshot error:', error);
      setSaveStatus(`Error: ${error.message}`);
      if (error.message.includes('Failed to fetch')) {
        setIsServerConnected(false);
        checkServer();
      }
    }
  };

  const handleSubmitRequirement = async (e) => {
    e.preventDefault(); // Prevent form submission
    if (!requirement.trim()) return;

    if (!isOpenAIServerConnected) {
      setSubmitError('OpenAI Server is not running. Please start the Python backend server on port 8000.');
      checkOpenAIServer();
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      console.log('Making API call with requirement:', requirement);
      const response = await fetch(`http://127.0.0.1:8000/get_screen_test_cases?prompt=${encodeURIComponent(requirement)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('OpenAI Response:', data);
        
        // Split the response by "/n" and add each line as a test case
        if (data.response) {
          const newTestCases = data.response.split('/n')
            .filter(text => text.trim())
            .map(text => ({
              id: Math.random().toString(36).substr(2, 9),
              text: text.trim(),
              completed: false
            }));
          
          setTestCases(currentTestCases => {
            const updatedTestCases = [...currentTestCases, ...newTestCases];
            // After updating test cases, make the call to get_react_code
            getReactCode(updatedTestCases);
            return updatedTestCases;
          });
        }
        
        setSubmitError('');
      } else {
        console.log('Error response from server:', response.status);
        setSubmitError(`Server error: ${response.status}`);
      }
      
      setRequirement(''); // Clear the input after submission
    } catch (error) {
      console.error('Error submitting requirement:', error);
      setSubmitError('Failed to connect to OpenAI Server. Please check if it\'s running on port 8000.');
      setIsOpenAIServerConnected(false);
      checkOpenAIServer();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to get React code based on test cases
  const getReactCode = async (testCases) => {
    try {
      // Extract just the text from test cases
      const testPoints = testCases.map(tc => tc.text);
      const testCasesString = testPoints.join('/n');
      
      // Store in module-scoped variable
      currentTestCasesString = testCasesString;
      console.log('Stored test cases string:', currentTestCasesString);
      
      const response = await fetch(`http://127.0.0.1:8000/get_react_code?prompt=${encodeURIComponent(testCasesString)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('React Code Response received:', data);
        
        if (data.response) {
          // Extract code between backticks
          const codeMatch = data.response.match(/```(?:jsx|javascript)?\n([\s\S]*?)```/);
          if (codeMatch && codeMatch[1]) {
            const extractedCode = codeMatch[1].trim();
            console.log('Extracted code:', extractedCode);
            
            // Update the file directly
            const updateResponse = await fetch('http://localhost:3001/api/write-file', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                path: 'webApp/src/components/CodeToggle.jsx',
                content: extractedCode
              })
            });

            if (updateResponse.ok) {
              console.log('Successfully updated CodeToggle.jsx');
              // Force a reload of the component
              setShowCode(prev => !prev);
              setTimeout(() => {
                setShowCode(prev => !prev);
                // Store test cases string right before taking screenshot
                setConcatenatedTestCases(testCasesString);
                console.log('Setting test cases right before screenshot:', testCasesString);
                // Wait 2 seconds after the component is reloaded, then take screenshot
                setTimeout(takeScreenshot, 2000);
              }, 100);
            } else {
              console.error('Failed to update CodeToggle.jsx');
            }
          } else {
            console.error('No code block found in response');
          }
        } else {
          console.error('No response data received from get_react_code');
        }
      } else {
        console.error('Failed to get React code:', response.status);
      }
    } catch (error) {
      console.error('Error getting React code:', error);
    }
  };

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginLeft: '10px'
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100vw',
      padding: '20px',
      boxSizing: 'border-box',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '95vw',
        maxWidth: '2000px',
        margin: '0 auto',
        backgroundColor: '#f5f5f5'
      }}>
        <h1 style={{
          fontSize: '3rem',
          color: '#000000',
          textAlign: 'center',
          marginBottom: '32px',
          width: '100%'
        }}>
          Live Coder
        </h1>
        <div style={{
          width: '100%',
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}>
          <h2 style={{ 
            margin: 0,
            fontSize: '2.5rem',
            color: '#4A90E2',
            fontWeight: '600'
          }}>Screen Requirements</h2>
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', width: '100%' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="Enter your requirement"
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #4A90E2',
                  fontSize: '16px',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  outline: 'none'
                }}
                disabled={isSubmitting}
              />
              <button
                onClick={handleSubmitRequirement}
                style={{
                  ...buttonStyle,
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
            {submitError && (
              <div style={{ color: 'red', fontSize: '14px' }}>
                {submitError}
              </div>
            )}
          </div>
        </div>

        <div style={{
          width: '100%',
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}>
          <h2 style={{ 
            margin: 0,
            marginBottom: '16px',
            fontSize: '2.5rem',
            color: '#4A90E2',
            fontWeight: '600'
          }}>Screen Test Cases</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {testCases.map(testCase => (
              <div 
                key={testCase.id} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              >
                <input
                  type="checkbox"
                  checked={testCase.completed}
                  onChange={() => toggleTestCase(testCase.id)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ 
                  flex: 1,
                  textDecoration: testCase.completed ? 'line-through' : 'none',
                  color: testCase.completed ? '#888' : '#333'
                }}>
                  {testCase.text}
                </span>
                <button
                  onClick={() => deleteTestCase(testCase.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff4444',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: '14px'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h1 style={{ 
            margin: 0,
            fontSize: '2.5rem',
            color: '#4A90E2',
            fontWeight: '600'
          }}>
            Code Sandbox
          </h1>
          <div>
            <button 
              onClick={() => setShowCode(prev => !prev)}
              style={buttonStyle}
            >
              {'</>'}
            </button>
            <button 
              onClick={takeScreenshot}
              style={buttonStyle}
            >
              📸 Take Screenshot
            </button>
            {saveStatus && (
              <span style={{ marginLeft: '10px', color: saveStatus.includes('success') ? 'green' : 'red' }}>
                {saveStatus}
              </span>
            )}
          </div>
        </div>

        <div ref={codeToggleRef} style={{ 
          border: '1px solid #ccc', 
          padding: '32px',
          borderRadius: 8,
          width: '100%',
          minHeight: '600px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'auto'
        }}>
          <div style={{ 
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto'
          }}>
            {showCode ? (
              <CodeBlock
                text={codeString}
                language="jsx"
                showLineNumbers={true}
                theme={dracula}
              />
            ) : (
              <CodeToggle ref={codeToggleRef} />
            )}
          </div>
        </div>

        {/* Evaluation Results Section */}
        {evaluationResult && (
          <div style={{
            width: '100%',
            marginTop: '24px',
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            border: '1px solid #ccc',
          }}>
            <h2 style={{ 
              margin: 0,
              marginBottom: '16px',
              fontSize: '2.5rem',
              color: '#4A90E2',
              fontWeight: '600'
            }}>Evaluation Results</h2>
            <div style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.5',
              color: '#000000'
            }}>
              {evaluationResult}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
