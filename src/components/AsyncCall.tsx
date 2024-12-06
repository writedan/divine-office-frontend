import React, { useEffect, useState, ReactNode } from 'react';
import ActivityIndicator from './ActivityIndicator';

interface AsyncCallProps {
  call: () => Promise<void>;
  message: string;
  children?: ReactNode;
}

const AsyncCall: React.FC<AsyncCallProps> = ({ call, message, children }) => {
  const [running, setRunning] = useState(true);

  console.log('[AsyncCall init]', message, running);

  useEffect(() => {
    console.log('[AsyncCall triggered]', message, running);

    // Define an async function to handle the async call
    const load = async () => {
      try {
        setRunning(true);
        console.log('[LOAD]', message);
        await call(); // Call the passed async function
      } catch (error) {
        console.error('[ERROR]', error); // Log errors if any occur
      } finally {
        setRunning(false); // Ensure state is updated after call finishes
      }
    };

    load(); // Trigger the async function when the effect runs

    // Return a cleanup function (optional, not strictly needed here)
    return () => setRunning(false); // If the component unmounts before async completes
  }, [call, message]); // Dependencies to rerun the effect if call or message change

  return running ? (
    <ActivityIndicator message={message} />
  ) : (
    children
  );
};

export default AsyncCall;
