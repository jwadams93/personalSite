import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { EMAIL_CONFIG } from './config';

// Polyfill for global (needed for Hydra in browser)
declare const global: any;
if (typeof global === 'undefined') {
  (window as any).global = window;
}

import HydraBackground from './components/HydraBackground';

// @ts-ignore
declare const anime: any;

interface TerminalLine {
  type: 'command' | 'output' | 'input';
  content: string;
  isTyping?: boolean;
}

const App: React.FC = () => {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [terminalPosition, setTerminalPosition] = useState(() => {
    // Calculate initial centered position
    const x = ((typeof window !== 'undefined' ? window.innerWidth : 1200) - 900) / 2;
    const y = ((typeof window !== 'undefined' ? window.innerHeight : 800) - 600) / 2;
    return { x: Math.max(0, x), y: Math.max(0, y) };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [userName, setUserName] = useState('guest');
  const [showScanLines, setShowScanLines] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const [introductionText, setIntroductionText] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [lastSize, setLastSize] = useState<{ width: number; height: number }>({ width: 900, height: 600 });

  const [hydraActive, setHydraActive] = useState(true);

  const commands = [
    'LINKEDIN - Connect with me on LinkedIn',
    'MESSAGE -name <name> -message <message> - Send me a message',
    'WHOAMI - Show current user name',
    'SETNAME <name> - Set your user name',
    'HYDRA - Toggle generative background',
    'HELP - Show available commands',
    'CLEAR - Clear the terminal'
  ];

  // Enhanced blinking cursor effect with anime.js
  useEffect(() => {
    const cursorAnimation = anime({
      targets: '.cursor',
      opacity: [1, 0],
      duration: 800,
      easing: 'easeInOutSine',
      direction: 'alternate',
      loop: true
    });

    return () => cursorAnimation.pause();
  }, []);

  // Window entrance animation
  useEffect(() => {
    if (terminalRef.current) {
      anime({
        targets: terminalRef.current,
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 1000,
        easing: 'easeOutElastic(1, 0.5)',
        delay: 200
      });
    }
  }, []);



  // Scan lines effect
  useEffect(() => {
    const scanLinesInterval = setInterval(() => {
      setShowScanLines(true);
      setTimeout(() => setShowScanLines(false), 100);
    }, 3000); // Every 3 seconds

    return () => clearInterval(scanLinesInterval);
  }, []);

  // Fetch introduction text
  useEffect(() => {
    fetch('/introduction.txt')
      .then(response => response.text())
      .then(text => setIntroductionText(text))
      .catch(error => {
        console.error('Error loading introduction:', error);
        setIntroductionText('Error loading introduction file.');
      });
  }, []);

  // Center terminal on load
  useEffect(() => {
    const centerTerminal = () => {
      // Don't center if terminal is closed or minimized
      if (isClosed || isMinimized) return;
      
      const x = (window.innerWidth - 900) / 2;
      const y = (window.innerHeight - 600) / 2;
      setTerminalPosition({ x: Math.max(0, x), y: Math.max(0, y) });
    };
    
    // Center immediately and also after a delay for the animation
    centerTerminal();
    setTimeout(centerTerminal, 100);
    window.addEventListener('resize', centerTerminal);
    return () => window.removeEventListener('resize', centerTerminal);
  }, [isClosed, isMinimized]);

  // Detect user name from browser data
  useEffect(() => {
    // Try to get name from various sources
    const detectUserName = () => {
      // Check if user has visited before and we stored their name
      const storedName = localStorage.getItem('terminalUserName');
      if (storedName) {
        setUserName(storedName);
        return;
      }

      // Default to guest for new users
      setUserName('guest');
    };

    detectUserName();
  }, []);

  // Initial typing animation
  useEffect(() => {
    if (currentStep === 0 && introductionText) {
      // Start with the command
      setLines([{ type: 'command', content: `${userName}@-jake-:~$ cat introduction.txt` }]);
      setCurrentStep(1);
    } else if (currentStep === 1 && introductionText) {
      // Type out the introduction text
      typeText(introductionText, 15); // Much faster typing speed
    }
  }, [currentStep, introductionText]);

  const typeText = (text: string, speed: number) => {
    setIsTyping(true);
    let index = 0;
    const lines = text.split('\n');
    
    const typeLine = (lineIndex: number, charIndex: number) => {
      if (lineIndex >= lines.length) {
        setIsTyping(false);
        setCurrentStep(2);
        showAvailableCommands();
        return;
      }

      if (charIndex <= lines[lineIndex].length) {
        const currentContent = lines.slice(0, lineIndex).join('\n') + 
          (lineIndex > 0 ? '\n' : '') + 
          lines[lineIndex].substring(0, charIndex);
        
        setLines(prev => {
          const newLines = [...prev];
          if (newLines.length > 1) {
            newLines[1] = { type: 'output', content: currentContent };
          } else {
            newLines.push({ type: 'output', content: currentContent });
          }
          return newLines;
        });

        setTimeout(() => typeLine(lineIndex, charIndex + 1), speed);
      } else {
        setTimeout(() => typeLine(lineIndex + 1, 0), speed * 2);
      }
    };

    typeLine(0, 0);
  };

  const showAvailableCommands = () => {
    setTimeout(() => {
      setLines(prev => [
        ...prev,
        { type: 'output' as const, content: '' },
        { type: 'output' as const, content: 'Available commands:' },
        ...commands.map(cmd => ({ type: 'output' as const, content: `  ${cmd}` })),
        { type: 'output' as const, content: '' }
      ]);
      setCurrentStep(3);
    }, 1000);
  };

  const handleInputChange = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.textContent || '';
    setCurrentInput(content);
  };

  const handleCommand = (command: string) => {
    const sanitizedCommand = command.trim();
    
    setLines(prev => [...prev, { type: 'input', content: command }]);

    // Check for MESSAGE command with flags
    if (sanitizedCommand.toUpperCase().startsWith('MESSAGE')) {
      handleMessageCommand(sanitizedCommand);
      return;
    }

    // Check for SETNAME command
    if (sanitizedCommand.toUpperCase().startsWith('SETNAME')) {
      const nameMatch = sanitizedCommand.match(/SETNAME\s+(.+)/i);
      if (nameMatch) {
        const newName = nameMatch[1].trim();
        storeUserName(newName);
        setLines(prev => [...prev, { type: 'output', content: `User name set to: ${newName}` }]);
      } else {
        setLines(prev => [...prev, { type: 'output', content: 'Usage: SETNAME <name>' }]);
      }
      setCurrentInput('');
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    switch (sanitizedCommand.toUpperCase()) {
      case 'LINKEDIN':
        window.open('https://linkedin.com/in/-jake-/', '_blank');
        setLines(prev => [...prev, { type: 'output', content: 'Opening LinkedIn profile...' }]);
        break;
      case 'WHOAMI':
        setLines(prev => [...prev, { type: 'output', content: `Current user: ${userName}` }]);
        break;
      case 'HELP':
        setLines(prev => [
          ...prev,
          { type: 'output' as const, content: 'Available commands:' },
          ...commands.map(cmd => ({ type: 'output' as const, content: `  ${cmd}` }))
        ]);
        break;
      case 'HYDRA':
        setHydraActive(!hydraActive);
        setLines(prev => [...prev, { type: 'output', content: `Hydra background ${hydraActive ? 'disabled' : 'enabled'}` }]);
        break;
      case 'CLEAR':
        setLines([]);
        setCurrentStep(3);
        setCurrentInput('');
        setTimeout(() => inputRef.current?.focus(), 100);
        return;
      default:
        setLines(prev => [...prev, { type: 'output', content: `Command not found: ${sanitizedCommand}. Type HELP for available commands.` }]);
        // Window shake animation for invalid command
        if (terminalRef.current) {
          anime({
            targets: terminalRef.current,
            translateX: [-10, 10, -10, 10, 0],
            duration: 400,
            easing: 'easeInOutSine'
          });
        }
    }

    setCurrentInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleMessageCommand = (command: string) => {
    // Parse MESSAGE command with flags
    const nameMatch = command.match(/-name\s+([^-]+)/i);
    const messageMatch = command.match(/-message\s+(.+)/i);
    
    if (!nameMatch || !messageMatch) {
      setLines(prev => [
        ...prev,
        { type: 'output', content: 'Usage: MESSAGE -name <name> -message <message>' },
        { type: 'output', content: 'Example: MESSAGE -name John -message Hello Jake!' }
      ]);
      setCurrentInput('');
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    const name = nameMatch[1].trim();
    const message = messageMatch[1].trim();

    // Store the user's name for future visits
    storeUserName(name);

    // Send message via email (using a service like EmailJS or similar)
    sendMessage(name, message);
  };

  const sendMessage = async (name: string, message: string) => {
    try {
      // Using Formspree for email functionality
      // You can replace this with EmailJS, or your own backend
      const response = await fetch(EMAIL_CONFIG.formspreeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          message: message,
          subject: 'New message from your website'
        }),
      });

      if (response.ok) {
        setLines(prev => [...prev, { type: 'output', content: `Message sent successfully! Thanks ${name}!` }]);
      } else {
        setLines(prev => [...prev, { type: 'output', content: 'Failed to send message. Please try again later.' }]);
      }
    } catch (error) {
      setLines(prev => [...prev, { type: 'output', content: 'Failed to send message. Please try again later.' }]);
    }

    setCurrentInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      handleCommand(currentInput);
    }
  };

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('terminal-header')) {
      // Only start dragging if clicking on the header, not on buttons
      if (!(e.target as HTMLElement).classList.contains('terminal-button')) {
        setIsDragging(true);
        const rect = terminalRef.current?.getBoundingClientRect();
        if (rect) {
          setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          });
        }
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep terminal within viewport bounds
      const maxX = window.innerWidth - 900; // terminal max width
      const maxY = window.innerHeight - 600; // terminal height
      
      setTerminalPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Focus input when terminal is ready
  useEffect(() => {
    if (currentStep >= 3 && !isClosed && !isMinimized && !isDragging) {
      const focusInput = () => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };
      
      // Try multiple times to ensure focus works
      focusInput();
      setTimeout(focusInput, 100);
      setTimeout(focusInput, 500);
      setTimeout(focusInput, 1000);
    }
  }, [currentStep, isClosed, isMinimized, isDragging]);

  // Store user name when they use MESSAGE command
  const storeUserName = (name: string) => {
    localStorage.setItem('terminalUserName', name);
    setUserName(name);
  };

  // Maximize/restore handler
  const handleMaximize = () => {
    if (!isMaximized) {
      setLastPosition(terminalPosition);
      setLastSize({ width: 900, height: 600 });
      setIsMaximized(true);
      setIsMinimized(false);
      
      // Maximize to full screen with animation
      if (terminalRef.current) {
        anime({
          targets: terminalRef.current,
          width: [900, window.innerWidth],
          height: [600, window.innerHeight],
          translateX: [terminalPosition.x, 0],
          translateY: [terminalPosition.y, 0],
          duration: 800,
          easing: 'easeOutElastic(1, 0.6)'
        });
      }
    } else {
      setIsMaximized(false);
      
      // Restore to original size and position
      if (terminalRef.current) {
        anime({
          targets: terminalRef.current,
          width: [window.innerWidth, 900],
          height: [window.innerHeight, 600],
          translateX: [0, lastPosition.x],
          translateY: [0, lastPosition.y],
          duration: 600,
          easing: 'easeOutBack(1.7)'
        });
      } else {
        setTerminalPosition(lastPosition);
      }
    }
  };

  // Minimize handler
  const handleMinimize = () => {
    // Animate terminal down to the dock first
    if (terminalRef.current) {
      const dockY = window.innerHeight - 100; // Dock position
      const currentY = terminalPosition.y;
      
      // Disable CSS transitions during animation
      terminalRef.current.style.transition = 'none';
      
      anime({
        targets: terminalRef.current,
        translateY: [currentY, dockY],
        scale: [1, 0.3],
        opacity: [1, 0],
        duration: 800,
        easing: 'easeInBack(1.7)',
        complete: () => {
          // Set state after animation completes
          setIsMinimized(true);
          setIsMaximized(false);
          
          // Re-enable CSS transitions
          if (terminalRef.current) {
            terminalRef.current.style.transition = '';
          }
          
          // Add a bounce effect to the dock icon
          const dockIcon = document.querySelector('.dock-icon');
          if (dockIcon) {
            anime({
              targets: dockIcon,
              scale: [1, 1.4, 1],
              duration: 600,
              easing: 'easeOutElastic(1, 0.8)'
            });
          }
        }
      });
    } else {
      setIsMinimized(true);
      setIsMaximized(false);
    }
  };

  // Restore from dock
  const handleRestore = () => {
    setIsMinimized(false);
    
    // Animate terminal back from dock to original position
    if (terminalRef.current) {
      const dockY = window.innerHeight - 100;
      const targetY = terminalPosition.y;
      
      // Disable CSS transitions during animation
      terminalRef.current.style.transition = 'none';
      
      // Start from dock position
      terminalRef.current.style.transform = `translate(${terminalPosition.x}px, ${dockY}px) scale(0.3)`;
      terminalRef.current.style.opacity = '0';
      
      // Animate back to normal with bounce
      setTimeout(() => {
        anime({
          targets: terminalRef.current,
          translateY: [dockY, targetY],
          scale: [0.3, 1.1, 1],
          opacity: [0, 1, 1],
          duration: 1000,
          easing: 'easeOutElastic(1, 0.8)',
          complete: () => {
            // Re-enable CSS transitions
            if (terminalRef.current) {
              terminalRef.current.style.transition = '';
            }
          }
        });
      }, 50);
    }
  };

  // Close handler
  const handleClose = () => {
    // Browser security prevents closing windows not opened by script
    // So we just fade out the terminal with animation
    if (terminalRef.current) {
      terminalRef.current.classList.add('closing');
      setTimeout(() => {
        setIsClosed(true);
        // Rush back in from the left after 2 seconds
        setTimeout(() => {
          setIsClosed(false);
          // Position terminal off-screen to the left
          const centerX = (window.innerWidth - 900) / 2;
          const centerY = (window.innerHeight - 600) / 2;
          
          // Set position and animate in one go
          setTerminalPosition({ x: -1000, y: centerY });
          
          // Animate it rushing back in with velocity and bounce
          setTimeout(() => {
            if (terminalRef.current) {
              anime({
                targets: terminalRef.current,
                translateX: [0, 100, -50, 20, 0], // Rush in with overshoot and settle
                duration: 1500,
                easing: 'easeOutElastic(1, 0.6)',
                complete: () => {
                  // Ensure final position is centered
                  setTerminalPosition({ x: Math.max(0, centerX), y: Math.max(0, centerY) });
                }
              });
            }
          }, 200);
        }, 2000); // 2 seconds delay
      }, 500); // Match the CSS animation duration
    } else {
      setIsClosed(true);
    }
  };


  return (
    <>
      <HydraBackground isActive={!isClosed && hydraActive} />
      <div className="terminal-container">
        {!isMinimized && !isClosed && (
          <div
            className={`terminal ${showScanLines ? 'scan-lines' : ''}`}
            ref={terminalRef}
            style={{
              transform: `translate(${terminalPosition.x}px, ${terminalPosition.y}px)`,
              cursor: isDragging ? 'grabbing' : 'default',
              zIndex: 10
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="terminal-header">
              <div className="terminal-buttons">
                <div className="terminal-button close" onClick={handleClose}></div>
                <div className="terminal-button minimize" onClick={handleMinimize}></div>
                <div className="terminal-button maximize" onClick={handleMaximize}></div>
              </div>
              <div className="terminal-title">{userName}@-jake-:~$</div>
            </div>
            <div className="terminal-content">
              {lines.map((line, index) => (
                <div key={index} className={`terminal-line ${line.type}`}>
                  {line.type === 'command' && !line.content.includes('@-jake-:~$') && (
                    <span className="prompt">{userName}@-jake-:~$ </span>
                  )}
                  <span className="content">{line.content}</span>
                </div>
              ))}
              {currentStep >= 3 && (
                <div className="terminal-line command">
                  <span className="prompt">{userName}@-jake-:~$ </span>
                  <span className="input-display">
                    {currentInput}
                    {showCursor && <span className="cursor">|</span>}
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="terminal-input"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    placeholder=""
                  />
                </div>
              )}
            </div>
          </div>
        )}
              {isMinimized && (
        <div className="terminal-dock" onClick={handleRestore}>
          <div className="dock-icon">
            <span role="img" aria-label="Terminal">🖥️</span>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default App;
