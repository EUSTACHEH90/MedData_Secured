
# 🔧 Script de vérification et configuration Hyperledger Fabric
# Exécuter depuis PowerShell en tant qu'administrateur

Write-Host "🚀 Vérification de l'environnement Hyperledger Fabric" -ForegroundColor Green

# 1. Vérifier WSL et Ubuntu
Write-Host "`n1️⃣ Vérification WSL..." -ForegroundColor Yellow
try {
    $wslList = wsl -l -v
    Write-Host "Distributions WSL disponibles:" -ForegroundColor Cyan
    Write-Host $wslList

    $ubuntuRunning = $wslList | Select-String "Ubuntu.*Running"
    if ($ubuntuRunning) {
        Write-Host "✅ Ubuntu WSL est actif" -ForegroundColor Green
    } else {
        Write-Host "❌ Ubuntu WSL n'est pas actif" -ForegroundColor Red
        Write-Host "💡 Lancez: wsl -d Ubuntu" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ WSL non installé ou non configuré" -ForegroundColor Red
    Write-Host "💡 Installez WSL2: https://docs.microsoft.com/windows/wsl/install" -ForegroundColor Yellow
}

# 2. Vérifier le chemin fabric-samples
Write-Host "`n2️⃣ Vérification du répertoire fabric-samples..." -ForegroundColor Yellow
$fabricPath = "\wsl.localhost\Ubuntu\home\user\fabric-samples\test-network"

if (Test-Path $fabricPath) {
    Write-Host "✅ Répertoire fabric-samples trouvé" -ForegroundColor Green

    # Lister les fichiers importants
    $files = Get-ChildItem $fabricPath | Select-Object Name, LastWriteTime
    Write-Host "Fichiers dans test-network:" -ForegroundColor Cyan
    $files | ForEach-Object { Write-Host "  - $($_.Name)" }

    # Vérifier network.sh
    if (Test-Path "$fabricPath\network.sh") {
        Write-Host "✅ Script network.sh présent" -ForegroundColor Green
    } else {
        Write-Host "❌ Script network.sh manquant" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Répertoire fabric-samples non trouvé à: $fabricPath" -ForegroundColor Red
    Write-Host '💡 Clonez fabric-samples dans WSL:' -ForegroundColor Yellow
    Write-Host '   wsl -d Ubuntu bash -c "cd /home/user && git clone https://github.com/hyperledger/fabric-samples.git"' -ForegroundColor Gray
}

# 3. Vérifier Docker dans WSL
Write-Host "`n3️⃣ Vérification Docker dans WSL..." -ForegroundColor Yellow
try {
    $dockerStatus = wsl -d Ubuntu docker --version
    Write-Host "✅ Docker installé: $dockerStatus" -ForegroundColor Green

    # Vérifier les conteneurs Fabric
    $containers = wsl -d Ubuntu docker ps --format "table {{.Names}}	{{.Status}}" | Select-String -Pattern "(peer|orderer|ca)"
    if ($containers) {
        Write-Host "✅ Conteneurs Fabric actifs:" -ForegroundColor Green
        $containers | ForEach-Object { Write-Host "  $($_)" -ForegroundColor Cyan }
    } else {
        Write-Host "❌ Aucun conteneur Fabric actif" -ForegroundColor Red
        Write-Host '💡 Lancez le réseau: wsl -d Ubuntu bash -c "cd /home/user/fabric-samples/test-network && ./network.sh up createChannel -ca"' -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Docker non accessible dans WSL" -ForegroundColor Red
    Write-Host "💡 Installez Docker Desktop avec intégration WSL2" -ForegroundColor Yellow
}

# 4. Vérifier les binaires Fabric
Write-Host "`n4️⃣ Vérification des binaires Fabric..." -ForegroundColor Yellow
try {
    $peerVersion = wsl -d Ubuntu bash -c "cd /home/user/fabric-samples/test-network && peer version --client 2>/dev/null"
    if ($peerVersion -match "peer:") {
        Write-Host "✅ Binaire peer disponible" -ForegroundColor Green
        Write-Host "Version: $($peerVersion -split "`n" | Select-String "Version")" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Binaire peer non trouvé" -ForegroundColor Red
        Write-Host '💡 Téléchargez les binaires: wsl -d Ubuntu bash -c "cd /home/user/fabric-samples && curl -sSL https://bit.ly/2ysbOFE | bash -s"' -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Impossible de tester les binaires Fabric" -ForegroundColor Red
}

# 5. Test de connectivité blockchain
Write-Host "`n5️⃣ Test de connectivité blockchain..." -ForegroundColor Yellow
try {
    $channelQuery = wsl -d Ubuntu bash -c "cd /home/user/fabric-samples/test-network && export PATH=\$PATH:/home/user/fabric-samples/bin && export FABRIC_CFG_PATH=/home/user/fabric-samples/config/ && export CORE_PEER_TLS_ENABLED=true && export CORE_PEER_LOCALMSPID='Org1MSP' && export CORE_PEER_TLS_ROOTCERT_FILE=/home/user/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt && export CORE_PEER_MSPCONFIGPATH=/home/user/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp && export CORE_PEER_ADDRESS=localhost:7051 && peer channel list 2>/dev/null"

    if ($channelQuery -match "mychannel") {
        Write-Host "✅ Canal 'mychannel' accessible" -ForegroundColor Green

        $chaincodes = wsl -d Ubuntu bash -c "cd /home/user/fabric-samples/test-network && export PATH=\$PATH:/home/user/fabric-samples/bin && export FABRIC_CFG_PATH=/home/user/fabric-samples/config/ && export CORE_PEER_TLS_ENABLED=true && export CORE_PEER_LOCALMSPID='Org1MSP' && export CORE_PEER_TLS_ROOTCERT_FILE=/home/user/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt && export CORE_PEER_MSPCONFIGPATH=/home/user/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp && export CORE_PEER_ADDRESS=localhost:7051 && peer lifecycle chaincode querycommitted --channelID mychannel 2>/dev/null"

        if ($chaincodes -match "meddata_secured") {
            Write-Host "✅ Chaincode 'meddata_secured' déployé" -ForegroundColor Green
        } else {
            Write-Host "❌ Chaincode 'meddata_secured' non déployé" -ForegroundColor Red
            Write-Host "💡 Déployez votre chaincode: ./network.sh deployCC -ccn meddata_secured -ccp ../chaincode/meddata" -ForegroundColor Yellow
            Write-Host "Chaincodes disponibles:" -ForegroundColor Cyan
            if ($chaincodes) {
                Write-Host $chaincodes -ForegroundColor Gray
            } else {
                Write-Host "  Aucun chaincode déployé" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "❌ Canal 'mychannel' non accessible" -ForegroundColor Red
        Write-Host "💡 Créez le canal: ./network.sh createChannel" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Impossible de tester la connectivité blockchain" -ForegroundColor Red
}

# 6. Résumé
Write-Host "`n📋 RÉSUMÉ ET PROCHAINES ÉTAPES" -ForegroundColor Magenta
Write-Host "=" * 50

$steps = @()

if (!(Get-Command "wsl" -ErrorAction SilentlyContinue)) {
    $steps += "1. Installer WSL2 et Ubuntu"
}

if (!(Test-Path $fabricPath)) {
    $steps += "2. Cloner fabric-samples dans WSL"
}

try {
    $dockerTest = wsl -d Ubuntu docker --version 2>$null
    if (!$dockerTest) {
        $steps += "3. Installer Docker Desktop avec WSL2"
    }
} catch {
    $steps += "3. Installer Docker Desktop avec WSL2"
}

try {
    $fabricTest = wsl -d Ubuntu bash -c "cd /home/user/fabric-samples/test-network && peer version --client 2>/dev/null"
    if (!($fabricTest -match "peer:")) {
        $steps += "4. Télécharger les binaires Fabric"
    }
} catch {
    $steps += "4. Télécharger les binaires Fabric"
}

try {
    $networkTest = wsl -d Ubuntu docker ps | Select-String "peer0.org1"
    if (!$networkTest) {
        $steps += "5. Démarrer le réseau Fabric"
    }
} catch {
    $steps += "5. Démarrer le réseau Fabric"
}

if ($steps.Count -eq 0) {
    Write-Host "🎉 Configuration complète ! Votre environnement Fabric est prêt." -ForegroundColor Green
    Write-Host "💡 Testez votre API blockchain maintenant." -ForegroundColor Cyan
} else {
    Write-Host "⚠️ Configuration incomplète. Étapes restantes:" -ForegroundColor Yellow
    $steps | ForEach-Object { Write-Host "  $_" -ForegroundColor White }

    Write-Host "`n🔧 Commandes utiles:" -ForegroundColor Cyan
    Write-Host '  • Démarrer le réseau: wsl -d Ubuntu bash -c "cd /home/user/fabric-samples/test-network && ./network.sh up createChannel -ca"' -ForegroundColor Gray
    Write-Host '  • Déployer chaincode: wsl -d Ubuntu bash -c "cd /home/user/fabric-samples/test-network && ./network.sh deployCC -ccn meddata_secured -ccp ../chaincode/meddata"' -ForegroundColor Gray
    Write-Host '  • Arrêter le réseau: wsl -d Ubuntu bash -c "cd /home/user/fabric-samples/test-network && ./network.sh down"' -ForegroundColor Gray
}

Write-Host "`n✅ Diagnostic terminé." -ForegroundColor Green
