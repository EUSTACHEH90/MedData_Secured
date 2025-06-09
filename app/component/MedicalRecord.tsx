import { useState } from 'react';

interface MedicalRecordProps {
  patientData: any;
  isNewRecord?: boolean;
}

export default function MedicalRecord({ patientData, isNewRecord = false }: MedicalRecordProps) {
  const [isEditing, setIsEditing] = useState(isNewRecord);
  const [recordData, setRecordData] = useState({
    observations: '',
    prescription: '',
    diagnosis: '',
    attachments: [] as File[],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      // 1. Chiffrement des données
      const encryptedData = await encryptMedicalData(recordData);

      // 2. Sauvegarde dans le cloud
      const cloudResponse = await saveToCloud(encryptedData);

      // 3. Enregistrement du lien dans la blockchain
      const blockchainData = {
        patientId: patientData.id,
        cloudLink: cloudResponse.link,
        timestamp: new Date().toISOString(),
        doctorId: 'current-doctor-id', // À remplacer par l'ID réel du médecin
        accessRights: ['current-doctor-id'], // Liste initiale des accès
      };

      await saveToBlockchain(blockchainData);

      setIsEditing(false);
    } catch (err) {
      setError('Erreur lors de la sauvegarde du dossier médical');
    } finally {
      setIsSaving(false);
    }
  };

  // Simulation des fonctions de chiffrement et de sauvegarde
  const encryptMedicalData = async (data: any) => {
    // Simulation du chiffrement
    return { ...data, encrypted: true };
  };

  const saveToCloud = async (data: any) => {
    // Simulation de la sauvegarde dans le cloud
    return { link: `cloud-link-${Date.now()}` };
  };

  const saveToBlockchain = async (data: any) => {
    // Simulation de l'enregistrement dans la blockchain
    await fetch('/api/blockchain/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {isNewRecord ? 'Nouveau dossier médical' : 'Dossier médical'}
        </h2>
        {!isNewRecord && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Modifier
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Informations du patient */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Patient</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nom</p>
              <p className="font-medium">{patientData.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Prénom</p>
              <p className="font-medium">{patientData.firstName}</p>
            </div>
          </div>
        </div>

        {/* Formulaire du dossier médical */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observations
            </label>
            <textarea
              value={recordData.observations}
              onChange={(e) =>
                setRecordData({ ...recordData, observations: e.target.value })
              }
              disabled={!isEditing}
              className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnostic
            </label>
            <textarea
              value={recordData.diagnosis}
              onChange={(e) =>
                setRecordData({ ...recordData, diagnosis: e.target.value })
              }
              disabled={!isEditing}
              className="w-full h-24 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordonnance
            </label>
            <textarea
              value={recordData.prescription}
              onChange={(e) =>
                setRecordData({ ...recordData, prescription: e.target.value })
              }
              disabled={!isEditing}
              className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Documents joints
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setRecordData({ ...recordData, attachments: files });
              }}
              disabled={!isEditing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm mt-2">{error}</div>
        )}

        {isEditing && (
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSaving}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 