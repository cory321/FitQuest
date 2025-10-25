import Confetti from 'react-confetti';
import { useState, useEffect } from 'react';

interface ConfettiEffectProps {
	active: boolean;
	onComplete?: () => void;
}

export function ConfettiEffect({ active, onComplete }: ConfettiEffectProps) {
	const [dimensions, setDimensions] = useState({
		width: window.innerWidth,
		height: window.innerHeight,
	});
	const [pieces, setPieces] = useState(200);

	useEffect(() => {
		const handleResize = () => {
			setDimensions({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {
		if (active) {
			setPieces(200);
			// Gradually reduce pieces for fade out effect
			const timeout = setTimeout(() => {
				setPieces(0);
				if (onComplete) {
					setTimeout(onComplete, 1000);
				}
			}, 3000);
			return () => clearTimeout(timeout);
		}
	}, [active, onComplete]);

	if (!active) return null;

	return (
		<Confetti
			width={dimensions.width}
			height={dimensions.height}
			numberOfPieces={pieces}
			recycle={false}
			colors={[
				'#E05D38',
				'#F59E0B',
				'#10B981',
				'#3B82F6',
				'#8B5CF6',
				'#EC4899',
			]}
		/>
	);
}
