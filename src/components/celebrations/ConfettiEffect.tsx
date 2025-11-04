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
	const [pieces, setPieces] = useState(0);

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
			setPieces(400); // More dramatic burst!
			// Gradually reduce pieces for fade out effect
			const timeout = setTimeout(() => {
				setPieces(0);
				if (onComplete) {
					setTimeout(onComplete, 1000);
				}
			}, 4000); // Let it run a bit longer
			return () => clearTimeout(timeout);
		} else {
			setPieces(0);
		}
	}, [active, onComplete]);

	if (!active) return null;

	return (
		<div className="fixed inset-0 pointer-events-none z-[9999]">
			<Confetti
				width={dimensions.width}
				height={dimensions.height}
				numberOfPieces={pieces}
				recycle={false}
				gravity={0.3}
				colors={[
					'#E05D38',
					'#F59E0B',
					'#10B981',
					'#3B82F6',
					'#8B5CF6',
					'#EC4899',
				]}
			/>
		</div>
	);
}
