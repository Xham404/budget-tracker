import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target } from 'lucide-react';

export default function BudgetTracker() {
  const [salary1, setSalary1] = useState(3000);
  const [salary2, setSalary2] = useState(2500);
  const [savings, setSavings] = useState(500);
  const [expenses, setExpenses] = useState([
    { id: 1, category: 'Électricité', amount: 120, type: 'fixe' },
    { id: 2, category: 'Téléphone', amount: 45, type: 'fixe' },
    { id: 3, category: 'Eau', amount: 60, type: 'fixe' },
    { id: 4, category: 'Internet', amount: 35, type: 'fixe' },
    { id: 5, category: 'Courses', amount: 400, type: 'variable' },
    { id: 6, category: 'Transport', amount: 80, type: 'variable' }
  ]);

  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    type: 'fixe'
  });

  const addExpense = () => {
    if (newExpense.category && newExpense.amount) {
      setExpenses([...expenses, {
        id: Date.now(),
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        type: newExpense.type
      }]);
      setNewExpense({ category: '', amount: '', type: 'fixe' });
    }
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  const updateExpense = (id, field, value) => {
    setExpenses(expenses.map(expense => 
      expense.id === id ? { ...expense, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : expense
    ));
  };

  const calculations = useMemo(() => {
    const totalSalary = salary1 + salary2;
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = totalSalary - totalExpenses - savings;
    const fixedExpenses = expenses.filter(e => e.type === 'fixe').reduce((sum, e) => sum + e.amount, 0);
    const variableExpenses = expenses.filter(e => e.type === 'variable').reduce((sum, e) => sum + e.amount, 0);
    
    const expenseRatio = (totalExpenses / totalSalary) * 100;
    const variableRatio = (variableExpenses / totalSalary) * 100;
    
    const expenseAnalysis = expenses.map(expense => {
      const ratioToIncome = (expense.amount / totalSalary) * 100;
      let status = 'normal';
      let suggestion = '';
      
      if (expense.category.toLowerCase().includes('téléphone') && expense.amount > 60) {
        status = 'warning';
        suggestion = 'Vérifiez votre forfait téléphonique. Des forfaits à moins de 20€/mois sont disponibles.';
      } else if (expense.category.toLowerCase().includes('électricité') && expense.amount > totalSalary * 0.05) {
        status = 'warning';
        suggestion = 'Facture électrique élevée. Pensez aux ampoules LED et aux appareils économes.';
      } else if (expense.category.toLowerCase().includes('courses') && expense.amount > totalSalary * 0.15) {
        status = 'warning';
        suggestion = 'Budget courses élevé. Planifiez vos repas et comparez les prix.';
      } else if (expense.category.toLowerCase().includes('transport') && expense.amount > totalSalary * 0.1) {
        status = 'warning';
        suggestion = 'Coûts de transport importants. Étudiez les abonnements ou le covoiturage.';
      } else if (ratioToIncome > 8 && expense.type === 'variable') {
        status = 'alert';
        suggestion = 'Cette dépense représente plus de 8% de vos revenus. Pourrait-elle être réduite ?';
      }
      
      return { ...expense, ratioToIncome, status, suggestion };
    });
    
    return {
      totalSalary,
      totalExpenses,
      remaining,
      fixedExpenses,
      variableExpenses,
      savingsRate: ((savings / totalSalary) * 100).toFixed(1),
      expenseRatio: expenseRatio.toFixed(1),
      variableRatio: variableRatio.toFixed(1),
      expenseAnalysis
    };
  }, [expenses, salary1, salary2, savings]);

  const pieData = [
    { name: 'Épargne', value: savings, color: '#10B981' },
    { name: 'Dépenses Fixes', value: calculations.fixedExpenses, color: '#EF4444' },
    { name: 'Dépenses Variables', value: calculations.variableExpenses, color: '#F59E0B' },
    { name: 'Reste', value: Math.max(0, calculations.remaining), color: '#3B82F6' }
  ];

  const barData = expenses.map(expense => ({
    category: expense.category,
    amount: expense.amount,
    type: expense.type
  }));

  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6'];

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">💰 Gestionnaire de Budget Mensuel</h1>
        <p className="text-gray-600">Suivez vos revenus, dépenses et épargne mensuels avec des conseils intelligents</p>
      </div>

      {/* Configuration des revenus et épargne */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <DollarSign className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Salaire 1</h3>
          </div>
          <input
            type="number"
            value={salary1}
            onChange={(e) => setSalary1(parseFloat(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-lg text-lg font-semibold text-green-600"
            placeholder="Premier salaire"
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <DollarSign className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Salaire 2</h3>
          </div>
          <input
            type="number"
            value={salary2}
            onChange={(e) => setSalary2(parseFloat(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-lg text-lg font-semibold text-green-600"
            placeholder="Deuxième salaire"
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Épargne Mensuelle</h3>
          </div>
          <input
            type="number"
            value={savings}
            onChange={(e) => setSavings(parseFloat(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-lg text-lg font-semibold text-blue-600"
            placeholder="Montant épargné"
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <TrendingDown className="h-6 w-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Taux d'Épargne</h3>
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {calculations.savingsRate}%
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Total: {calculations.totalSalary.toFixed(0)} €
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Tableau des dépenses */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Dépenses Mensuelles</h2>
            
            {/* Ajouter une dépense */}
            <div className="flex flex-wrap gap-2 mb-4">
              <input
                type="text"
                placeholder="Catégorie"
                value={newExpense.category}
                onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                className="flex-1 min-w-32 p-2 border border-gray-300 rounded"
              />
              <input
                type="number"
                placeholder="Montant"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                className="w-24 p-2 border border-gray-300 rounded"
              />
              <select
                value={newExpense.type}
                onChange={(e) => setNewExpense({...newExpense, type: e.target.value})}
                className="p-2 border border-gray-300 rounded"
              >
                <option value="fixe">Fixe</option>
                <option value="variable">Variable</option>
              </select>
              <button
                onClick={addExpense}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-semibold">Catégorie</th>
                    <th className="text-left py-3 px-2 font-semibold">Montant (€)</th>
                    <th className="text-left py-3 px-2 font-semibold">Type</th>
                    <th className="text-left py-3 px-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    const analysis = calculations.expenseAnalysis.find(a => a.id === expense.id);
                    return (
                      <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={expense.category}
                              onChange={(e) => updateExpense(expense.id, 'category', e.target.value)}
                              className="flex-1 p-1 border-none bg-transparent focus:bg-white focus:border focus:border-gray-300 rounded transition-all"
                            />
                            {analysis?.status === 'warning' && (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" title={analysis.suggestion} />
                            )}
                            {analysis?.status === 'alert' && (
                              <AlertTriangle className="h-4 w-4 text-red-500" title={analysis.suggestion} />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            value={expense.amount}
                            onChange={(e) => updateExpense(expense.id, 'amount', e.target.value)}
                            className="w-full p-1 border-none bg-transparent focus:bg-white focus:border focus:border-gray-300 rounded transition-all"
                          />
                          <div className="text-xs text-gray-500">
                            {analysis?.ratioToIncome.toFixed(1)}% des revenus
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <select
                            value={expense.type}
                            onChange={(e) => updateExpense(expense.id, 'type', e.target.value)}
                            className="w-full p-1 border-none bg-transparent focus:bg-white focus:border focus:border-gray-300 rounded transition-all"
                          >
                            <option value="fixe">Fixe</option>
                            <option value="variable">Variable</option>
                          </select>
                        </td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="text-red-600 hover:text-red-800 p-1 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Résumé */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Dépenses fixes:</span>
                  <span className="font-semibold">{calculations.fixedExpenses.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span>Dépenses variables:</span>
                  <span className="font-semibold">{calculations.variableExpenses.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total dépenses:</span>
                  <span>{calculations.totalExpenses.toFixed(2)} €</span>
                </div>
                <div className={`flex justify-between font-semibold text-lg border-t pt-2 ${calculations.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <span>Reste disponible:</span>
                  <span>{calculations.remaining.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="space-y-6">
          {/* Graphique en secteurs */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Répartition du Budget</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} €`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique en barres */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Dépenses par Catégorie</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={barData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} €`, 'Montant']} />
                <Bar dataKey="amount" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Indicateurs clés */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Indicateurs Financiers</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="text-green-800">Revenus totaux du foyer</span>
                <span className="font-bold text-green-600">{calculations.totalSalary.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-100 rounded text-sm">
                <span className="text-green-700">• Salaire 1: {salary1.toFixed(2)} € • Salaire 2: {salary2.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                <span className="text-red-800">Dépenses totales</span>
                <span className="font-bold text-red-600">{calculations.totalExpenses.toFixed(2)} € ({calculations.expenseRatio}%)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <span className="text-blue-800">Épargne mensuelle</span>
                <span className="font-bold text-blue-600">{savings.toFixed(2)} €</span>
              </div>
              <div className={`flex justify-between items-center p-3 rounded ${calculations.remaining >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className={calculations.remaining >= 0 ? 'text-green-800' : 'text-red-800'}>
                  {calculations.remaining >= 0 ? 'Budget restant' : 'Déficit'}
                </span>
                <span className={`font-bold ${calculations.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(calculations.remaining).toFixed(2)} €
                </span>
              </div>
            </div>
          </div>

          {/* Détecteur de dépenses inutiles */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <Target className="h-5 w-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">🎯 Détecteur de Dépenses Inutiles</h3>
            </div>
            
            {/* Analyse globale */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${
                  parseFloat(calculations.expenseRatio) > 70 ? 'bg-red-500' :
                  parseFloat(calculations.expenseRatio) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <span className="font-medium">
                  Analyse globale : {calculations.expenseRatio}% de vos revenus en dépenses
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                {parseFloat(calculations.expenseRatio) > 70 
                  ? "⚠️ Attention : Vos dépenses sont très élevées par rapport à vos revenus"
                  : parseFloat(calculations.expenseRatio) > 60
                  ? "⚡ Vos dépenses sont modérées, mais il y a de la marge d'amélioration"
                  : "✅ Excellente gestion ! Vos dépenses sont bien maîtrisées"
                }
              </div>
            </div>

            {/* Conseils spécifiques */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800 flex items-center">
                <Lightbulb className="h-4 w-4 text-yellow-500 mr-2" />
                Conseils personnalisés
              </h4>
              
              {calculations.expenseAnalysis
                .filter(expense => expense.suggestion)
                .map((expense, index) => (
                  <div key={expense.id} className={`p-3 rounded-lg border-l-4 ${
                    expense.status === 'alert' ? 'bg-red-50 border-red-400' :
                    expense.status === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    'bg-blue-50 border-blue-400'
                  }`}>
                    <div className="font-medium text-sm text-gray-800">
                      {expense.category} ({expense.amount}€ - {expense.ratioToIncome.toFixed(1)}%)
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      💡 {expense.suggestion}
                    </div>
                  </div>
                ))
              }
              
              {calculations.expenseAnalysis.filter(e => e.suggestion).length === 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-700">
                    🎉 Félicitations ! Aucune dépense suspecte détectée. Votre budget semble bien équilibré.
                  </div>
                </div>
              )}
            </div>

            {/* Recommandations générales */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">📋 Plan d'action recommandé</h4>
              <div className="space-y-2 text-sm text-gray-600">
                {parseFloat(calculations.savingsRate) < 10 && (
                  <div>• <strong>Augmentez votre épargne</strong> : Visez au moins 10% de vos revenus ({(calculations.totalSalary * 0.1).toFixed(0)}€)</div>
                )}
                {parseFloat(calculations.variableRatio) > 25 && (
                  <div>• <strong>Maîtrisez vos dépenses variables</strong> : Elles représentent {calculations.variableRatio}% de vos revenus</div>
                )}
                <div>• <strong>Règle 50/30/20</strong> : 50% besoins essentiels, 30% loisirs, 20% épargne</div>
                <div>• <strong>Suivez vos dépenses</strong> : Tenez un journal pendant 1 mois pour identifier les fuites</div>
                <div>• <strong>Négociez vos contrats</strong> : Téléphone, assurance, énergie tous les ans</div>
                <div>• <strong>Automatisez votre épargne</strong> : Virez automatiquement au début du mois</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
