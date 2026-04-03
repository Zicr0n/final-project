export function moveTowardTarget(
	x: number,
	y: number,
	targetX: number,
	targetY: number,
	speed: number,
	dt: number
) {
	const dx = targetX - x;
	const dy = targetY - y;
	const dist = Math.sqrt(dx * dx + dy * dy);

	if (dist <= 1) {
		return { x, y, moved: false };
	}

	const step = Math.min(speed * dt, dist);

	return {
		x: x + (dx / dist) * step,
		y: y + (dy / dist) * step,
		moved: true
	};
}

export function interpolatePosition(
	x: number,
	y: number,
	targetX: number,
	targetY: number,
	dt: number
) {
	return {
		x: x + (targetX - x) * 10 * dt,
		y: y + (targetY - y) * 10 * dt
	};
}