from sympy import symbols, Eq, solve

A1, A2, A3, A4 = symbols('A1 A2 A3 A4')

eqs = [
    Eq(A3, A1 + A2),
    Eq(A4, A3 * 10)
]

solution = solve([eqs[0], eqs[1], Eq(A4, 80)], [A1, A2, A3], dict=True)
print(solution)
