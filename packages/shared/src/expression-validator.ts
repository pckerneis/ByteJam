import * as acorn from 'acorn';

const allowedGlobals = new Set([
    't',
    'Math',
    'sin',
    'cos',
    'tan',
    'abs',
    'floor',
    'ceil',
    'sqrt',
    'pow',
    'min',
    'max',
    'round',
    'random',
]);

const disallowedNodes = new Set<string>([
    'ForStatement',
    'WhileStatement',
    'DoWhileStatement',
    'SwitchStatement',
    'IfStatement',
]);

type AcornNode = acorn.Node & {
    [key: string]: unknown;
};

interface ValidationContext {
    errors: string[];
    warnings: string[];
    declaredVars: Set<string>;
    scope: Array<Set<string>>;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

class BytebeatValidator {
    validate(expr: string): ValidationResult {
        const code = `(function(t) { return ${expr})`;

        try {
            // Parse the code into an AST
            const ast = acorn.parse(code, {
                ecmaVersion: 2020,
                sourceType: 'script',
            });

            // Walk the AST and validate
            const errors: string[] = [];
            const warnings: string[] = [];
            const declaredVars = new Set<string>();

            this.walkNode(ast as unknown as AcornNode, {
                errors,
                warnings,
                declaredVars,
                scope: [new Set(allowedGlobals)],
            });

            return {
                valid: errors.length === 0,
                errors,
                warnings,
            };
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return {
                valid: false,
                errors: [`Parse error: ${message}`],
                warnings: [],
            };
        }
    }

    walkNode(node: AcornNode, context: ValidationContext): void {
        if (!node || typeof node !== 'object') return;

        // Check for disallowed node types
        if (disallowedNodes.has(node.type)) {
            context.errors.push(`${node.type} is not allowed in bytebeat expressions`);
        }

        // Track variable declarations
        if (node.type === 'VariableDeclaration') {
            for (const decl of (node as any).declarations ?? []) {
                if (decl.id?.type === 'Identifier') {
                    context.scope[context.scope.length - 1].add(decl.id.name);
                    context.declaredVars.add(decl.id.name);
                }
            }
        }

        // Track function parameters
        if (
            node.type === 'FunctionDeclaration' ||
            node.type === 'FunctionExpression' ||
            node.type === 'ArrowFunctionExpression'
        ) {
            const currentScope = context.scope[context.scope.length - 1];
            const newScope = new Set<string>(currentScope);

            for (const param of (node as any).params ?? []) {
                if (param.type === 'Identifier') {
                    newScope.add(param.name);
                }
            }

            context.scope.push(newScope);

            // Walk function body
            if ((node as any).body) {
                this.walkNode((node as any).body, context);
            }

            context.scope.pop();
            return; // Don't walk children again
        }

        // Check identifier usage
        if (node.type === 'Identifier' && !this.isInDeclarationPosition(node)) {
            const isDeclared = context.scope.some((scope) => scope.has((node as any).name));

            if (!isDeclared) {
                context.errors.push(`Undefined variable: '${(node as any).name}'`);
            }
        }

        // Check for dangerous patterns
        if (node.type === 'CallExpression') {
            const callee = (node as any).callee;
            if (callee?.type === 'Identifier') {
                const funcName = callee.name;
                if (funcName === 'eval' || funcName === 'Function') {
                    context.errors.push(`Dangerous function call: ${funcName}`);
                }
            }
        }

        // Check for property access that might be dangerous
        if (node.type === 'MemberExpression' && !(node as any).computed) {
            const property = (node as any).property;
            if (property?.type === 'Identifier') {
                const propName = property.name;
                if (['constructor', 'prototype', '__proto__'].includes(propName)) {
                    context.warnings.push(
                        `Potentially dangerous property access: ${propName}`,
                    );
                }
            }
        }

        // Recursively walk all child nodes
        for (const key in node) {
            if (key === 'loc' || key === 'range') continue;

            const child = (node as any)[key];
            if (Array.isArray(child)) {
                child.forEach((c) => this.walkNode(c, context));
            } else if (child && typeof child === 'object') {
                this.walkNode(child as AcornNode, context);
            }
        }
    }

    isInDeclarationPosition(_node: AcornNode): boolean {
        // This is a simplified check - in a real implementation,
        // you'd track parent relationships more carefully
        return false;
    }
}

export function validateExpression(expr: string): ValidationResult {
    const validator = new BytebeatValidator();
    return validator.validate(expr);
}
