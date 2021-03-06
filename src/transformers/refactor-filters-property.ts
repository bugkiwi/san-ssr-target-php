import { FunctionExpression, MethodDeclaration, TypeGuards, PropertyDeclaration } from 'ts-morph'

export function refactorFiltersProperty (filters: PropertyDeclaration) {
    const filtersDefinitions = filters.getInitializer()
    if (!filtersDefinitions) return
    if (!TypeGuards.isObjectLiteralExpression(filtersDefinitions)) return
    for (const prop of filtersDefinitions.getProperties()) {
        let body: MethodDeclaration | FunctionExpression | undefined
        if (TypeGuards.isMethodDeclaration(prop)) {
            body = prop
        }
        if (TypeGuards.isPropertyAssignment(prop)) {
            const init = prop.getInitializer()
            if (init && TypeGuards.isFunctionExpression(init)) body = init
        }
        if (typeof body !== 'undefined') {
            body.insertParameter(0, {
                name: 'sanssrSelf',
                type: filters.getParentOrThrow().getName()
            })
            body.forEachDescendant(node => {
                if (TypeGuards.isThisExpression(node)) {
                    node.replaceWithText('sanssrSelf')
                }
            })
        }
    }
}
