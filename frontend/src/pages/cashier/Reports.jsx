const Reports = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payment Reports</h1>
        <p className="text-gray-600 mt-2">View payment and transaction reports</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-xl font-medium mb-2">Reports Coming Soon</p>
          <p>This feature is under development</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
