import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, Download, FileText, Menu, X } from 'lucide-react';

export default function BudgetTracker() {
  const [salary1, setSalary1] = useState(3000);
  const [salary2, setSalary2] = useState(2500);
  const [savings, setSavings] = useState(500);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
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

  // Détection côté client pour éviter les erreurs SSR
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Fonctions de téléchargement
  const downloadJSON = () => {
    const data = {
      date: new Date().toLocaleDateString('fr-FR'),
      revenus: {
        salaire1: salary1,
        salaire2: salary2,
        total: calculations.totalSalary
      },
      epargne: savings,
      depenses: expenses,
      analyse: {
        totalDepenses: calculations.totalExpenses,
        depensesFixes: calculations.fixedExpenses,
        depensesVariables: calculations.variableExpenses,
        budgetRestant: calculations.remaining,
        tauxEpargne: calculations.savingsRate + '%',
        ratioDepenses: calculations.expenseRatio + '%'
      },
      conseils: calculations.expenseAnalysis
        .filter(expense => expense.suggestion)
        .map(expense => ({
          categorie: expense.category,
          montant: expense.amount,
          pourcentageRevenus: expense.ratioToIncome.toFixed(1) + '%',
          conseil: expense.suggestion
        }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const csvHeader = 'Catégorie,Montant,Type,Pourcentage des revenus,Statut,Conseil\n';
    const csvData = expenses.map(expense => {
      const analysis = calculations.expenseAnalysis.find(a => a.id === expense.id);
      return [
        expense.category,
        expense.amount,
        expense.type,
        analysis?.ratioToIncome.toFixed(1) + '%',
        analysis?.status || 'normal',
        (analysis?.suggestion || '').replace(/,/g, ';')
      ].join(',');
    }).join('\n');

    const summaryData = `\nRésumé:\nSalaire 1,${salary1}\nSalaire 2,${salary2}\nTotal revenus,${calculations.totalSalary}\nÉpargne,${savings}\nDépenses totales,${calculations.totalExpenses}\nBudget restant,${calculations.remaining}\nTaux d'épargne,${calculations.savingsRate}%`;

    const fullCSV = csvHeader + csvData + summaryData;
    const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const reportContent = `
# RAPPORT BUDGÉTAIRE - ${new Date().toLocaleDateString('fr-FR')}

## REVENUS DU FOYER
- Salaire 1: ${salary1.toFixed(2)} €
- Salaire 2: ${salary2.toFixed(2)} €
- **Total revenus: ${calculations.totalSalary.toFixed(2)} €**

## ÉPARGNE ET DÉPENSES
- Épargne mensuelle: ${savings.toFixed(2)} €
- Taux d'épargne: ${calculations.savingsRate}%
- Dépenses fixes: ${calculations.fixedExpenses.toFixed(2)} €
- Dépenses variables: ${calculations.variableExpenses.toFixed(2)} €
- **Total dépenses: ${calculations.totalExpenses.toFixed(2)} €**
- **Budget restant: ${calculations.remaining.toFixed(2)} €**

## DÉTAIL DES DÉPENSES
${expenses.map(expense => {
  const analysis = calculations.expenseAnalysis.find(a => a.id === expense.id);
  return `- ${expense.category}: ${expense.amount} € (${expense.type}) - ${analysis?.ratioToIncome.toFixed(1)}% des revenus`;
}).join('\n')}

## ANALYSE ET CONSEILS
Ratio dépenses/revenus: ${calculations.expenseRatio}%

${calculations.expenseAnalysis
  .filter(expense => expense.suggestion)
  .map(expense => `⚠️ ${expense.category} (${expense.amount}€): ${expense.suggestion}`)
  .join('\n\n')}

## RECOMMANDATIONS GÉNÉRALES
${parseFloat(calculations.savingsRate) < 10 ? `- Augmentez votre épargne : Visez au moins 10% de vos revenus (${(calculations.totalSalary * 0.1).toFixed(0)}€)\n` : ''}
${parseFloat(calculations.variableRatio) > 25 ? `- Maîtrisez vos dépenses variables : Elles représentent ${calculations.variableRatio}% de vos revenus\n` : ''}
- Règle 50/30/20 : 50% besoins essentiels, 30% loisirs, 20% épargne
- Suivez vos dépenses : Tenez un journal pendant 1 mois
- Négociez vos contrats : Téléphone, assurance, énergie tous les ans
- Automatisez votre épargne : Virez automatiquement au début du mois
    `;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-budget-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Header responsive */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
                💰 Budget Tracker
              </h1>
            </div>
            
            {/* Menu desktop - boutons téléchargement */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={downloadJSON}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 transition-colors"
                title="Télécharger en JSON"
              >
                <Download className="h-4 w-4 mr-1 text-gray-700" />
                <span className="text-black">JSON</span>
              </button>
              <button
                onClick={downloadCSV}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 transition-colors"
                title="Télécharger en CSV"
              >
                <FileText className="h-4 w-4 mr-1 text-gray-700" />
                <span className="text-black">CSV</span>
              </button>
              <button
                onClick={downloadPDF}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 transition-colors"
                title="Télécharger le rapport"
              >
                <FileText className="h-4 w-4 mr-1 text-gray-700" />
                <span className="text-black">Rapport</span>
              </button>
            </div>

            {/* Menu mobile */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-black hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-black" />
                ) : (
                  <Menu className="h-6 w-6 text-black" />
                )}
              </button>
            </div>
          </div>

          {/* Menu mobile déroulant */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    downloadJSON();
                    setIsMobileMenuOpen(false);
                  }}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-black hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Download className="h-4 w-4 mr-2 text-gray-700" />
                  <span className="text-black">Télécharger JSON</span>
                </button>
                <button
                  onClick={() => {
                    downloadCSV();
                    setIsMobileMenuOpen(false);
                  }}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-black hover:bg-gray-100 rounded-md transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2 text-gray-700" />
                  <span className="text-black">Télécharger CSV</span>
                </button>
                <button
                  onClick={() => {
                    downloadPDF();
                    setIsMobileMenuOpen(false);
                  }}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-black hover:bg-gray-100 rounded-md transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2 text-gray-700" />
                  <span className="text-black">Télécharger Rapport</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <p className="text-sm sm:text-base text-gray-800">
            Suivez vos revenus, dépenses et épargne mensuels avec des conseils intelligents
          </p>
        </div>

        {/* Configuration des revenus et épargne - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2" />
              <h3 className="text-sm sm:text-lg font-semibold text-gray-800">Salaire 1</h3>
            </div>
            <input
              type="number"
              value={salary1}
              onChange={(e) => setSalary1(parseFloat(e.target.value) || 0)}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg text-base sm:text-lg font-semibold text-green-600 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Premier salaire"
            />
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2" />
              <h3 className="text-sm sm:text-lg font-semibold text-gray-800">Salaire 2</h3>
            </div>
            <input
              type="number"
              value={salary2}
              onChange={(e) => setSalary2(parseFloat(e.target.value) || 0)}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg text-base sm:text-lg font-semibold text-green-600 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Deuxième salaire"
            />
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2" />
              <h3 className="text-sm sm:text-lg font-semibold text-gray-800">Épargne</h3>
            </div>
            <input
              type="number"
              value={savings}
              onChange={(e) => setSavings(parseFloat(e.target.value) || 0)}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg text-base sm:text-lg font-semibold text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Montant épargné"
            />
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mr-2" />
              <h3 className="text-sm sm:text-lg font-semibold text-gray-800">Taux d'Épargne</h3>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">
              {calculations.savingsRate}%
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">
              Total: {calculations.totalSalary.toFixed(0)} €
            </div>
          </div>
        </div>

        {/* Layout responsive principal */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Tableau des dépenses */}
          <div className="bg-white rounded-lg shadow-md order-1 xl:order-1">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">📋 Dépenses Mensuelles</h2>
              
              {/* Ajouter une dépense - Responsive */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Catégorie"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Montant"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  className="w-full sm:w-24 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={newExpense.type}
                  onChange={(e) => setNewExpense({...newExpense, type: e.target.value})}
                  className="w-full sm:w-auto p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="fixe">Fixe</option>
                  <option value="variable">Variable</option>
                </select>
                <button
                  onClick={addExpense}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center transition-colors"
                >
                  <Plus className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Ajouter</span>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Table responsive */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-sm sm:text-base">Catégorie</th>
                      <th className="text-left py-3 px-2 font-semibold text-sm sm:text-base">Montant</th>
                      <th className="text-left py-3 px-2 font-semibold text-sm sm:text-base hidden sm:table-cell">Type</th>
                      <th className="text-left py-3 px-2 font-semibold text-sm sm:text-base">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => {
                      const analysis = calculations.expenseAnalysis.find(a => a.id === expense.id);
                      return (
                        <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={expense.category}
                                  onChange={(e) => updateExpense(expense.id, 'category', e.target.value)}
                                  className="flex-1 p-1 border-none bg-transparent focus:bg-white focus:border focus:border-gray-300 rounded transition-all text-sm sm:text-base"
                                />
                                {analysis?.status === 'warning' && (
                                  <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" title={analysis.suggestion} />
                                )}
                                {analysis?.status === 'alert' && (
                                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" title={analysis.suggestion} />
                                )}
                              </div>
                              <div className="sm:hidden mt-1">
                                <select
                                  value={expense.type}
                                  onChange={(e) => updateExpense(expense.id, 'type', e.target.value)}
                                  className="text-xs p-1 border border-gray-200 rounded bg-gray-50"
                                >
                                  <option value="fixe">Fixe</option>
                                  <option value="variable">Variable</option>
                                </select>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              value={expense.amount}
                              onChange={(e) => updateExpense(expense.id, 'amount', e.target.value)}
                              className="w-full p-1 border-none bg-transparent focus:bg-white focus:border focus:border-gray-300 rounded transition-all text-sm sm:text-base"
                            />
                            <div className="text-xs text-gray-500">
                              {analysis?.ratioToIncome.toFixed(1)}%
                            </div>
                          </td>
                          <td className="py-3 px-2 hidden sm:table-cell">
                            <select
                              value={expense.type}
                              onChange={(e) => updateExpense(expense.id, 'type', e.target.value)}
                              className="w-full p-1 border-none bg-transparent focus:bg-white focus:border focus:border-gray-300 rounded transition-all text-sm"
                            >
                              <option value="fixe">Fixe</option>
                              <option value="variable">Variable</option>
                            </select>
                          </td>
                          <td className="py-3 px-2">
                            <button
                              onClick={() => deleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-800 p-1 transition-colors"
                              title="Supprimer"
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

              {/* Résumé responsive */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Dépenses fixes:</span>
                    <span className="font-semibold">{calculations.fixedExpenses.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dépenses variables:</span>
                    <span className="font-semibold">{calculations.variableExpenses.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base border-t pt-2 sm:col-span-1">
                    <span>Total dépenses:</span>
                    <span>{calculations.totalExpenses.toFixed(2)} €</span>
                  </div>
                  <div className={`flex justify-between font-semibold text-base border-t pt-2 sm:col-span-1 ${calculations.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span>Reste:</span>
                    <span>{calculations.remaining.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Graphiques et analyses */}
          <div className="space-y-4 sm:space-y-6 order-2 xl:order-2">
            {/* Graphique en secteurs */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">📊 Répartition du Budget</h3>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => {
                        // Masquer les labels sur mobile si trop petits
                        return isClient && window.innerWidth > 640 ? `${name} (${(percent * 100).toFixed(1)}%)` : '';
                      }}
                      outerRadius="70%"
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
              {/* Légende pour mobile */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center text-xs">
                    <div 
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="truncate">{entry.name}: {entry.value}€</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Graphique en barres */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">📈 Dépenses par Catégorie</h3>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{ top: 5, right: 10, left: 5, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={isClient && window.innerWidth > 640 ? 12 : 10}
                    />
                    <YAxis fontSize={isClient && window.innerWidth > 640 ? 12 : 10} />
                    <Tooltip formatter={(value) => [`${value} €`, 'Montant']} />
                    <Bar dataKey="amount" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Indicateurs clés */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">📊 Indicateurs Financiers</h3>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="text-green-800 text-sm sm:text-base">Revenus totaux</span>
                  <span className="font-bold text-green-600 text-sm sm:text-base">{calculations.totalSalary.toFixed(2)} €</span>
                </div>
                <div className="p-3 bg-green-100 rounded text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between text-green-700">
                    <span>Salaire 1: {salary1.toFixed(2)} €</span>
                    <span>Salaire 2: {salary2.toFixed(2)} €</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <span className="text-red-800 text-sm sm:text-base">Dépenses totales</span>
                  <div className="text-right">
                    <span className="font-bold text-red-600 text-sm sm:text-base">{calculations.totalExpenses.toFixed(2)} €</span>
                    <div className="text-xs text-red-500">({calculations.expenseRatio}%)</div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="text-blue-800 text-sm sm:text-base">Épargne mensuelle</span>
                  <span className="font-bold text-blue-600 text-sm sm:text-base">{savings.toFixed(2)} €</span>
                </div>
                <div className={`flex justify-between items-center p-3 rounded ${calculations.remaining >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <span className={`text-sm sm:text-base ${calculations.remaining >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                    {calculations.remaining >= 0 ? 'Budget restant' : 'Déficit'}
                  </span>
                  <span className={`font-bold text-sm sm:text-base ${calculations.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(calculations.remaining).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {/* Détecteur de dépenses inutiles */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mr-2" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">🎯 Détecteur de Dépenses</h3>
              </div>
              
              {/* Analyse globale */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    parseFloat(calculations.expenseRatio) > 70 ? 'bg-red-500' :
                    parseFloat(calculations.expenseRatio) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className="font-medium text-sm sm:text-base">
                    Analyse globale : {calculations.expenseRatio}% de vos revenus
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mb-4">
                  {parseFloat(calculations.expenseRatio) > 70 
                    ? "⚠️ Attention : Vos dépenses sont très élevées"
                    : parseFloat(calculations.expenseRatio) > 60
                    ? "⚡ Vos dépenses sont modérées, améliorable"
                    : "✅ Excellente gestion !"
                  }
                </div>
              </div>

              {/* Conseils spécifiques */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800 flex items-center text-sm sm:text-base">
                  <Lightbulb className="h-4 w-4 text-yellow-500 mr-2" />
                  Conseils personnalisés
                </h4>
                
                <div className="max-h-64 sm:max-h-80 overflow-y-auto space-y-2 sm:space-y-3">
                  {calculations.expenseAnalysis
                    .filter(expense => expense.suggestion)
                    .map((expense) => (
                      <div key={expense.id} className={`p-3 rounded-lg border-l-4 ${
                        expense.status === 'alert' ? 'bg-red-50 border-red-400' :
                        expense.status === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                        'bg-blue-50 border-blue-400'
                      }`}>
                        <div className="font-medium text-xs sm:text-sm text-gray-800">
                          {expense.category} ({expense.amount}€ - {expense.ratioToIncome.toFixed(1)}%)
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">
                          💡 {expense.suggestion}
                        </div>
                      </div>
                    ))
                  }
                  
                  {calculations.expenseAnalysis.filter(e => e.suggestion).length === 0 && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-xs sm:text-sm text-green-700">
                        🎉 Félicitations ! Aucune dépense suspecte détectée.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommandations générales */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3 text-sm sm:text-base">📋 Plan d'action</h4>
                <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                  {parseFloat(calculations.savingsRate) < 10 && (
                    <div>• <strong>Augmentez l'épargne</strong> : Visez 10% ({(calculations.totalSalary * 0.1).toFixed(0)}€)</div>
                  )}
                  {parseFloat(calculations.variableRatio) > 25 && (
                    <div>• <strong>Maîtrisez les variables</strong> : {calculations.variableRatio}% des revenus</div>
                  )}
                  <div>• <strong>Règle 50/30/20</strong> : 50% essentiels, 30% loisirs, 20% épargne</div>
                  <div>• <strong>Journal 1 mois</strong> : Identifiez les fuites</div>
                  <div>• <strong>Négociez annuellement</strong> : Téléphone, énergie, assurances</div>
                  <div>• <strong>Automatisez l'épargne</strong> : Virement début de mois</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec informations de téléchargement */}
        <footer className="mt-8 p-4 bg-white rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600 text-center sm:text-left">
              <p>💾 Vos données sont sauvegardées localement dans votre navigateur</p>
              <p className="hidden sm:block">Téléchargez vos données pour les conserver ou les partager</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:hidden">
              <button
                onClick={downloadJSON}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Download className="h-3 w-3 mr-1" />
                JSON
              </button>
              <button
                onClick={downloadCSV}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-3 w-3 mr-1" />
                CSV
              </button>
              <button
                onClick={downloadPDF}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-3 w-3 mr-1" />
                Rapport
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
