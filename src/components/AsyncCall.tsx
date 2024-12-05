import { useEffect, useState } from 'react';
import ActivityIndicator from './ActivityIndicator';

const AsyncCall = ({call, message, children}) => {
	const [running, setRunning] = useState(false);

	useEffect(() => {
		async function load() {
			await call();
			setRunning(false);
		};

		setRunning(true);
		load();
	}, []);

	return running ? (
		<ActivityIndicator message={message} />
	) : children;
};

export default AsyncCall;