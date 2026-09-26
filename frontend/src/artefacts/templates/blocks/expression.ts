/**
 * Compiles a maths expression in x, such as "3x^2 - sin(2x)/x", to a function.
 * A small recursive-descent parser, never `eval`: numbers, x, pi, e, + - * / ^,
 * parentheses, implicit multiplication ("2x", "3(x+1)") and the functions
 * below. Throws on anything else.
 */
const functions: Record<string, (value: number) => number> = {
	sin: Math.sin,
	cos: Math.cos,
	tan: Math.tan,
	asin: Math.asin,
	acos: Math.acos,
	atan: Math.atan,
	sinh: Math.sinh,
	cosh: Math.cosh,
	tanh: Math.tanh,
	exp: Math.exp,
	ln: Math.log,
	log: Math.log10,
	sqrt: Math.sqrt,
	abs: Math.abs,
	floor: Math.floor,
	ceil: Math.ceil,
};
const constants: Record<string, number> = { pi: Math.PI, e: Math.E };

type Fn = (x: number) => number;
type Token = { kind: "number"; value: number } | { kind: "name"; value: string } | { kind: "op"; value: string };

function tokenize(source: string): Token[] {
	const tokens: Token[] = [];
	const pattern = /\s*(?:(\d+\.?\d*(?:e[+-]?\d+)?|\.\d+)|([a-z]+)|(\*\*|[-+*/^()]))/giy;
	let index = 0;
	while (index < source.length) {
		pattern.lastIndex = index;
		const match = pattern.exec(source);
		if (!match || match[0].length === 0) {
			if (/^\s*$/.test(source.slice(index))) break;
			throw new Error(`Unexpected "${source.slice(index).trim()[0]}"`);
		}
		index = pattern.lastIndex;
		if (match[1]) tokens.push({ kind: "number", value: Number(match[1]) });
		else if (match[2]) tokens.push({ kind: "name", value: match[2].toLowerCase() });
		else tokens.push({ kind: "op", value: match[3] === "**" ? "^" : match[3] });
	}
	return tokens;
}

export function compile(source: string): Fn {
	const tokens = tokenize(source);
	let position = 0;
	const peek = () => tokens[position];
	const isOp = (value: string) => peek()?.kind === "op" && peek()?.value === value;
	const startsPrimary = () => peek()?.kind === "number" || peek()?.kind === "name" || isOp("(");

	const expression = (): Fn => {
		let left = term();
		while (isOp("+") || isOp("-")) {
			const op = tokens[position++].value;
			const right = term();
			const a = left;
			left = op === "+" ? (x) => a(x) + right(x) : (x) => a(x) - right(x);
		}
		return left;
	};
	const term = (): Fn => {
		let left = unary();
		for (;;) {
			if (isOp("*") || isOp("/")) {
				const op = tokens[position++].value;
				const right = unary();
				const a = left;
				left = op === "*" ? (x) => a(x) * right(x) : (x) => a(x) / right(x);
			} else if (startsPrimary()) {
				// Implicit multiplication: "2x", "x(x+1)", "2 sin(x)".
				const right = power();
				const a = left;
				left = (x) => a(x) * right(x);
			} else return left;
		}
	};
	const unary = (): Fn => {
		if (isOp("-")) {
			position++;
			const inner = unary();
			return (x) => -inner(x);
		}
		if (isOp("+")) {
			position++;
			return unary();
		}
		return power();
	};
	const power = (): Fn => {
		const base = primary();
		if (!isOp("^")) return base;
		position++;
		// Right-associative, and binds tighter than a leading minus: -x^2 = -(x^2).
		const exponent = unary();
		return (x) => base(x) ** exponent(x);
	};
	const primary = (): Fn => {
		const token = tokens[position++];
		if (!token) throw new Error("Unexpected end of expression");
		if (token.kind === "number") return () => token.value;
		if (token.kind === "op" && token.value === "(") {
			const inner = expression();
			if (!isOp(")")) throw new Error("Missing )");
			position++;
			return inner;
		}
		if (token.kind === "name") {
			if (token.value === "x") return (x) => x;
			if (token.value in constants) {
				const value = constants[token.value];
				return () => value;
			}
			const fn = functions[token.value];
			if (fn) {
				const argument = isOp("(") ? primary() : power();
				return (x) => fn(argument(x));
			}
			throw new Error(`Unknown name "${token.value}"`);
		}
		throw new Error(`Unexpected "${token.value}"`);
	};

	const result = expression();
	if (position < tokens.length) throw new Error(`Unexpected "${tokens[position].value}"`);
	return result;
}
