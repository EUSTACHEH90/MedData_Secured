import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PatientSearchProps {
  onPatientFound: (patientData: any) => void;
  onNewPatient: () => void;
}

export default function PatientSearch({ onPatientFound, onNewPatient }: PatientSearchProps) {
  const [identificationMethod, setIdentificationMethod] = useState<'id' | 'manual'>('id');
  const [idNumber, setIdNumber] = useState('');
  const [manualInfo, setManualInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
  });
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setSearching(true);
    setError('');

    try {
      // Simulation de la recherche dans la blockchain
      const response = await fetch('/api/patients/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          identificationMethod === 'id'
            ? { idNumber }
            : manualInfo
        ),
      });

      const data = await response.json();

      if (data.found) {
        onPatientFound(data.patient);
      } else {
        setError('Aucun dossier trouvé pour ce patient');
      }
    } catch (error) {
      setError('Erreur lors de la recherche du patient');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Recherche de patient</h2>

      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-md ${
              identificationMethod === 'id'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setIdentificationMethod('id')}
          >
            Carte d'identité
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              identificationMethod === 'manual'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setIdentificationMethod('manual')}
          >
            Saisie manuelle
          </button>
        </div>

        {identificationMethod === 'id' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Numéro de carte d'identité
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Entrez le numéro de carte d'identité"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom
              </label>
              <input
                type="text"
                value={manualInfo.lastName}
                onChange={(e) =>
                  setManualInfo({ ...manualInfo, lastName: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Prénom
              </label>
              <input
                type="text"
                value={manualInfo.firstName}
                onChange={(e) =>
                  setManualInfo({ ...manualInfo, firstName: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date de naissance
              </label>
              <input
                type="date"
                value={manualInfo.dateOfBirth}
                onChange={(e) =>
                  setManualInfo({ ...manualInfo, dateOfBirth: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
          >
            {searching ? 'Recherche...' : 'Rechercher le patient'}
          </button>
          <button
            onClick={onNewPatient}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Nouveau patient
          </button>
        </div>
      </div>
    </div>
  );
} 