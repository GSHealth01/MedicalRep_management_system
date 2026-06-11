import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { FaSort, FaSortUp, FaSortDown, FaUser } from 'react-icons/fa';

export default function EmployeeOverview() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('designation'); // default sort by designation
  const [sortOrder, setSortOrder] = useState('asc');

  // Hierarchy rank: lower number = higher power
  const HIERARCHY = {
    'OM': 1, 'SM': 2, 'MGR': 3, 'PM': 4, 'TM': 5,
    'PPES': 6, 'PPEJ': 7, 'FC': 8, 'MR': 9
  };

  // Map abbreviations to full designations
  const designationMap = {
    'OM':   'Operations Manager',
    'SM':   'Senior Manager',
    'MGR':  'Manager',
    'PM':   'Products Manager',
    'TM':   'Territory Manager',
    'PPES': 'Product Promotion Executive - Senior',
    'PPEJ': 'Product Promotion Executive - Junior',
    'FC':   'Field Coordinator',
    'MR':   'Medical Representative',
    'ADMIN':'Admin'
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get('/users/employees');
        setEmployees(response.data.data || []);
      } catch (err) {
        console.error('Error fetching employees:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Group employees by designation
  const groupedEmployees = useMemo(() => {
    const groups = {};
    employees.forEach(emp => {
      const des = emp.designation || 'OTHER';
      if (!groups[des]) groups[des] = [];
      groups[des].push(emp);
    });

    // Sort individuals within each group by name
    Object.keys(groups).forEach(des => {
      groups[des].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    });

    return groups;
  }, [employees]);

  // The order in which to show the groups
  const groupOrder = ['OM', 'SM', 'MGR', 'PM', 'TM', 'PPES', 'PPEJ', 'FC', 'MR'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading employees...</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <h2 className="text-2xl font-bold flex items-center">
              <FaUser className="mr-2" />
              Employee Overview
            </h2>
            <p className="text-blue-100">Manage and view employee details grouped by designation</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groupOrder.map(designationCode => {
                  const group = groupedEmployees[designationCode];
                  if (!group || group.length === 0) return null;

                  return (
                    <React.Fragment key={designationCode}>
                      {/* Designation Header Row */}
                      <tr className="bg-gray-50 border-t-2 border-gray-100">
                        <td colSpan="5" className="px-6 py-3 text-sm font-bold text-blue-800">
                          {designationMap[designationCode] || designationCode} ( {group.length} )
                        </td>
                      </tr>
                      {/* Individual Employee Rows */}
                      {group.map(employee => (
                        <tr
                          key={employee.id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                          onClick={() => navigate(`/employee-rep-dashboard/${employee.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {employee.name?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                <div className="text-sm text-gray-500">ID: {employee.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {designationMap[employee.designation] || employee.designation}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {employee.sector?.range || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {employee.sector?.agency || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {employee.team?.name || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {Object.keys(groupedEmployees).length === 0 && (
            <div className="text-center py-12">
              <FaUser className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding some employees.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}