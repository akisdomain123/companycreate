import React, { useState, useRef, useEffect } from 'react';
import { Send, Download, FileSpreadsheet, Loader2, Trash2, Plus, X, Sparkles, Upload } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState({});
  const [isGoogleAuthed, setIsGoogleAuthed] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Use environment variables (recommended) or fallback to placeholders
  const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || 'YOUR_GOOGLE_API_KEY';
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Load Google API
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client:auth2', initGoogleClient);
    };
    document.body.appendChild(script);
  }, []);

  const initGoogleClient = () => {
    try {
      window.gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        scope: SCOPES
      }).then(() => {
        const authInstance = window.gapi.auth2.getAuthInstance();
        setIsGoogleAuthed(authInstance.isSignedIn.get());
        authInstance.isSignedIn.listen(setIsGoogleAuthed);
      });
    } catch (error) {
      console.error('Error initializing Google API:', error);
    }
  };

  const handleGoogleSignIn = () => {
    window.gapi.auth2.getAuthInstance().signIn();
  };

  const handleGoogleSignOut = () => {
    window.gapi.auth2.getAuthInstance().signOut();
  };

  const createGoogleSheet = async (sheet) => {
    if (!isGoogleAuthed) {
      addMessage('assistant', 'Please sign in to Google first to save to Google Sheets.');
      return;
    }

    setGoogleLoading(true);
    try {
      // Create a new spreadsheet
      const createResponse = await window.gapi.client.sheets.spreadsheets.create({
        properties: {
          title: sheet.name
        },
        sheets: [{
          properties: {
            title: 'Sheet1'
          }
        }]
      });

      const spreadsheetId = createResponse.result.spreadsheetId;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

      // Prepare data with headers
      const values = [
        sheet.columns,
        ...sheet.data
      ];

      // Update the spreadsheet with data
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: values
        }
      });

      // Format the header row
      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                    textFormat: {
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                      bold: true
                    }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: sheet.columns.length
                }
              }
            }
          ]
        }
      });

      // Add formulas if they exist
      if (sheet.formulas && sheet.formulas.length > 0) {
        const formulaUpdates = sheet.formulas.map(f => ({
          range: `Sheet1!${f.cell}`,
          values: [[f.formula]]
        }));

        for (const update of formulaUpdates) {
          await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: update.range,
            valueInputOption: 'USER_ENTERED',
            resource: {
              values: update.values
            }
          });
        }
      }

      addMessage('assistant', 
        `✅ Successfully created Google Sheet! You can view it here: ${spreadsheetUrl}`
      );

      // Update local sheet with Google Sheets ID
      setSpreadsheets(prev => ({
        ...prev,
        [sheet.id]: {
          ...sheet,
          googleSheetId: spreadsheetId,
          googleSheetUrl: spreadsheetUrl
        }
      }));

    } catch (error) {
      console.error('Error creating Google Sheet:', error);
      addMessage('assistant', 'Sorry, there was an error creating the Google Sheet. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const updateGoogleSheet = async (sheet) => {
    if (!sheet.googleSheetId) {
      addMessage('assistant', 'This spreadsheet is not linked to Google Sheets yet. Save it first!');
      return;
    }

    setGoogleLoading(true);
    try {
      const values = [
        sheet.columns,
        ...sheet.data
      ];

      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: sheet.googleSheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: values
        }
      });

      addMessage('assistant', '✅ Google Sheet updated successfully!');
    } catch (error) {
      console.error('Error updating Google Sheet:', error);
      addMessage('assistant', 'Sorry, there was an error updating the Google Sheet.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const callClaude = async (userMessage, conversationHistory) => {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [
            ...conversationHistory,
            { role: 'user', content: userMessage }
          ],
          system: `You are a spreadsheet generation assistant. Your job is to understand user requests and generate appropriate spreadsheet structures.

When a user asks to create a spreadsheet, respond with ONLY a JSON object (no markdown formatting, no backticks) in this exact format:
{
  "action": "create_spreadsheet",
  "spreadsheet_type": "descriptive name",
  "columns": ["Column1", "Column2", ...],
  "sample_data": [
    ["value1", "value2", ...],
    ["value1", "value2", ...]
  ],
  "formulas": [
    {"cell": "A10", "formula": "=SUM(A2:A9)", "description": "Total"}
  ],
  "message": "Friendly explanation of what was created"
}

When user asks to add a row, respond with:
{
  "action": "add_row",
  "message": "Added a new row"
}

When user asks to remove/delete a row, respond with:
{
  "action": "remove_row",
  "row_number": number,
  "message": "Removed row X"
}

When user asks to save to Google Sheets, respond with:
{
  "action": "save_to_google",
  "message": "Saving to Google Sheets..."
}

When user asks to update Google Sheets, respond with:
{
  "action": "update_google",
  "message": "Updating Google Sheets..."
}

For general conversation, respond with:
{
  "action": "chat",
  "message": "Your conversational response"
}

Supported spreadsheet types include: reimbursement, invoice, CRM, inventory, budget, timesheet, project tracker, sales pipeline, event planning, employee records, and more.

IMPORTANT: Your entire response must be valid JSON. Do not include any text before or after the JSON object.`
        })
      });

      const data = await response.json();
      const assistantMessage = data.content.find(c => c.type === 'text')?.text || '';
      
      try {
        const cleanedMessage = assistantMessage.trim();
        const jsonResponse = JSON.parse(cleanedMessage);
        return jsonResponse;
      } catch (e) {
        console.error('JSON parse error:', e, 'Response:', assistantMessage);
        return {
          action: 'chat',
          message: assistantMessage
        };
      }
    } catch (error) {
      console.error('Claude API error:', error);
      return {
        action: 'error',
        message: 'Sorry, I encountered an error processing your request.'
      };
    }
  };

  const generateSpreadsheetId = () => `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const createSpreadsheet = (claudeResponse) => {
    const spreadsheetId = generateSpreadsheetId();
    const newSheet = {
      id: spreadsheetId,
      name: claudeResponse.spreadsheet_type || 'Spreadsheet',
      type: claudeResponse.spreadsheet_type,
      columns: claudeResponse.columns || [],
      data: claudeResponse.sample_data || [],
      formulas: claudeResponse.formulas || [],
      googleSheetId: null,
      googleSheetUrl: null
    };

    setSpreadsheets(prev => ({ ...prev, [spreadsheetId]: newSheet }));
    return newSheet;
  };

  const addRow = (sheetId) => {
    setSpreadsheets(prev => {
      const sheet = prev[sheetId];
      if (!sheet) return prev;

      const newRow = sheet.columns.map(() => '');
      return {
        ...prev,
        [sheetId]: {
          ...sheet,
          data: [...sheet.data, newRow]
        }
      };
    });
  };

  const removeRow = (sheetId, rowIndex) => {
    setSpreadsheets(prev => {
      const sheet = prev[sheetId];
      if (!sheet || sheet.data.length <= 1) return prev;

      return {
        ...prev,
        [sheetId]: {
          ...sheet,
          data: sheet.data.filter((_, idx) => idx !== rowIndex)
        }
      };
    });
  };

  const updateCell = (sheetId, rowIndex, colIndex, value) => {
    setSpreadsheets(prev => {
      const sheet = prev[sheetId];
      if (!sheet) return prev;

      const newData = [...sheet.data];
      newData[rowIndex] = [...newData[rowIndex]];
      newData[rowIndex][colIndex] = value;

      return {
        ...prev,
        [sheetId]: {
          ...sheet,
          data: newData
        }
      };
    });
  };

  const deleteSpreadsheet = (sheetId) => {
    setSpreadsheets(prev => {
      const newSheets = { ...prev };
      delete newSheets[sheetId];
      return newSheets;
    });
  };

  const downloadSpreadsheet = (sheet) => {
    let csvContent = sheet.columns.join(',') + '\n';
    
    sheet.data.forEach(row => {
      csvContent += row.map(cell => {
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sheet.name.replace(/[^a-z0-9]/gi, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date() }]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const claudeResponse = await callClaude(userMessage, conversationHistory);

      if (claudeResponse.message) {
        addMessage('assistant', claudeResponse.message);
      }

      const sheetIds = Object.keys(spreadsheets);
      const currentSheet = sheetIds.length > 0 ? spreadsheets[sheetIds[sheetIds.length - 1]] : null;

      switch (claudeResponse.action) {
        case 'create_spreadsheet':
          createSpreadsheet(claudeResponse);
          break;

        case 'add_row':
          if (currentSheet) {
            addRow(currentSheet.id);
          }
          break;

        case 'remove_row':
          if (currentSheet) {
            const rowIndex = (claudeResponse.row_number || 1) - 1;
            removeRow(currentSheet.id, rowIndex);
          }
          break;

        case 'save_to_google':
          if (currentSheet) {
            await createGoogleSheet(currentSheet);
          } else {
            addMessage('assistant', 'No spreadsheet to save. Please create one first.');
          }
          break;

        case 'update_google':
          if (currentSheet) {
            await updateGoogleSheet(currentSheet);
          } else {
            addMessage('assistant', 'No spreadsheet to update.');
          }
          break;

        case 'delete_spreadsheet':
          if (currentSheet) {
            deleteSpreadsheet(currentSheet.id);
          }
          break;

        case 'chat':
        case 'error':
        default:
          break;
      }

    } catch (error) {
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 via-blue-600 to-indigo-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <FileSpreadsheet className="w-8 h-8 text-white" />
                  <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Google Sheets AI Agent</h1>
                  <p className="text-blue-100 text-sm">Create spreadsheets and save directly to Google Sheets</p>
                </div>
              </div>
              <div>
                {!isGoogleAuthed ? (
                  <button
                    onClick={handleGoogleSignIn}
                    className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </button>
                ) : (
                  <button
                    onClick={handleGoogleSignOut}
                    className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Chat Section */}
            <div className="flex flex-col h-[600px]">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <div className="relative inline-block mb-4">
                      <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-400" />
                      <Sparkles className="w-6 h-6 text-green-500 absolute -top-2 -right-2 animate-pulse" />
                    </div>
                    <p className="text-lg font-medium mb-2">Welcome to Google Sheets AI Agent!</p>
                    <p className="text-sm text-gray-600 mb-4">Create spreadsheets and save them directly to Google Sheets</p>
                    <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
                      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-700">💼 "Create a sales tracker"</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-700">📊 "Make an expense report"</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-700">💾 "Save this to Google Sheets"</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white'
                          : 'bg-white border border-gray-200 shadow-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                        <span className="text-sm text-gray-600">Processing...</span>
                      </div>
                    </div>
                  </div>
                )}

                {googleLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-green-200 rounded-lg p-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                        <span className="text-sm text-gray-600">Saving to Google Sheets...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Describe your spreadsheet or say 'save to Google Sheets'..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Spreadsheet Preview */}
            <div className="flex flex-col h-[600px]">
              <div className="flex-1 overflow-auto bg-gray-50 rounded-lg p-4">
                {Object.keys(spreadsheets).length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <FileSpreadsheet className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg">No spreadsheets yet</p>
                      <p className="text-sm mt-2">Create one using natural language</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.values(spreadsheets).map((sheet) => (
                      <div key={sheet.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                        {/* Spreadsheet Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-green-50">
                          <div>
                            <h3 className="font-semibold text-gray-800">{sheet.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {sheet.data.length} rows · {sheet.columns.length} columns
                              {sheet.googleSheetUrl && (
                                <span className="ml-2">
                                  · <a href={sheet.googleSheetUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                                    View in Google Sheets
                                  </a>
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => addRow(sheet.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Add Row"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            {sheet.googleSheetId ? (
                              <button
                                onClick={() => updateGoogleSheet(sheet)}
                                disabled={googleLoading}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Update Google Sheet"
                              >
                                <Upload className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => createGoogleSheet(sheet)}
                                disabled={!isGoogleAuthed || googleLoading}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Save to Google Sheets"
                              >
                                <Upload className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => downloadSpreadsheet(sheet)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download CSV"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteSpreadsheet(sheet.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Spreadsheet Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gradient-to-r from-gray-100 to-green-50">
                                <th className="w-10 p-2 text-center text-gray-500 font-mono text-xs">#</th>
                                {sheet.columns.map((col, idx) => (
                                  <th key={idx} className="p-2 text-left font-semibold text-gray-700 border-l border-gray-200 min-w-[120px]">
                                    {col}
                                  </th>
                                ))}
                                <th className="w-10 p-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {sheet.data.map((row, rowIdx) => (
                                <tr key={rowIdx} className="border-t border-gray-200 hover:bg-green-50 transition-colors">
                                  <td className="p-2 text-center text-gray-400 font-mono text-xs bg-gray-50">
                                    {rowIdx + 1}
                                  </td>
                                  {row.map((cell, colIdx) => (
                                    <td key={colIdx} className="p-1 border-l border-gray-200">
                                      <input
                                        type="text"
                                        value={cell}
                                        onChange={(e) => updateCell(sheet.id, rowIdx, colIdx, e.target.value)}
                                        className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-green-500 rounded bg-transparent hover:bg-white transition-colors"
                                      />
                                    </td>
                                  ))}
                                  <td className="p-2">
                                    <button
                                      onClick={() => removeRow(sheet.id, rowIdx)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                                      title="Delete Row"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Formulas Section */}
                        {sheet.formulas && sheet.formulas.length > 0 && (
                          <div className="p-4 bg-gradient-to-r from-gray-50 to-green-50 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-2">📐 Formulas:</p>
                            <div className="space-y-1">
                              {sheet.formulas.map((formula, idx) => (
                                <p key={idx} className="text-xs text-gray-600 font-mono">
                                  <span className="font-semibold text-green-600">{formula.cell}:</span> {formula.formula}
                                  {formula.description && <span className="text-gray-500"> // {formula.description}</span>}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-sm text-gray-600">
          <p>Powered by Claude AI & Google Sheets API · {isGoogleAuthed ? '✅ Connected' : '⚠️ Not connected to Google'}</p>
        </div>
      </div>
    </div>
  );
}

