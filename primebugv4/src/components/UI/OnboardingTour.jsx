import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useAuth } from '../../contexts/AuthContext';
import { getProjectsByTeam } from '../../services/projects'; // IMPORTACIÓN DEL SERVICIO
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useLocation } from 'react-router-dom';

const OnboardingTour = () => {
    // 1. EXTRAEMOS currentTeam PARA VALIDAR EL EQUIPO
    const { user, currentTeam } = useAuth();
    const location = useLocation();

    const [isFullyOnboarded, setIsFullyOnboarded] = useState(true);
    const [runTour, setRunTour] = useState(false);
    const [currentSteps, setCurrentSteps] = useState([]);
    const [currentTourKey, setCurrentTourKey] = useState(''); // Nos ayuda a saber en qué pantalla estamos

    // 2. NUEVOS ESTADOS PARA EL GUARDIÁN DE PROYECTOS
    const [hasProjects, setHasProjects] = useState(false);
    const [checkingData, setCheckingData] = useState(true);

    // 3. Verificamos el estado en Firebase al cargar
    useEffect(() => {
        const checkStatus = async () => {
            if (!user) return;
            try {
                const userRef = doc(db, 'profiles', user.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    setIsFullyOnboarded(!!docSnap.data().has_seen_onboarding);
                }
            } catch (error) {
                console.error("Error verificando onboarding:", error);
            }
        };
        checkStatus();

        // Escuchador para reiniciar desde el perfil
        const handleRestart = () => {
            setIsFullyOnboarded(false);
        };
        
        window.addEventListener('restartOnboardingTour', handleRestart);
        return () => window.removeEventListener('restartOnboardingTour', handleRestart);
    }, [user]);

    // 4. NUEVO EFFECT: Guardián que verifica si el equipo tiene proyectos
    useEffect(() => {
        const verifyData = async () => {
            // Si no hay usuario, ni equipo, o si el tour ya está completado, no necesitamos hacer la consulta a BD
            if (!currentTeam || !user || isFullyOnboarded) {
                setCheckingData(false);
                return;
            }

            try {
                const res = await getProjectsByTeam(currentTeam.id, user.uid);
                // Si la respuesta es exitosa y el array tiene elementos, tiene proyectos
                setHasProjects(res.success && res.data && res.data.length > 0);
            } catch (err) {
                console.error("Error verificando proyectos para el tour:", err);
                setHasProjects(false);
            } finally {
                setCheckingData(false);
            }
        };

        verifyData();
    }, [currentTeam, user, isFullyOnboarded]);

    // 5. Cerebro de Navegación
    useEffect(() => {
        // 👇 RESTRICCIÓN INYECTADA: Si no tiene equipo o no tiene proyectos, no calculamos rutas.
        if (isFullyOnboarded || checkingData || !currentTeam || !hasProjects) return;

        setRunTour(false);
        const path = location.pathname;
        let nextSteps = [];
        let key = '';

        if (path.includes('/bugs/crear')) {
            key = 'bugCreate';
            // ORDEN ESTRICTO: Primero Adjuntos, Segundo Botón de Submit
            nextSteps = [
                { 
                    target: '.tour-attachments', 
                    content: 'Tip Pro: ¡Los mejores reportes incluyen evidencia! Usa esta zona para subir capturas de pantalla o logs.', 
                    placement: 'top' 
                },
                { 
                    target: '.tour-btn-submit', 
                    content: 'Una vez que completes los detalles, haz clic en "Registrar Bug" para finalizar.', 
                    placement: 'top' 
                }
            ];
        } else if (path.includes('/bugs')) {
            key = 'bugList';
            nextSteps = [{ target: '.tour-btn-reportar', content: '¡Llegaste al tablero! Usa este botón para abrir el formulario y crear tu primer reporte.', placement: 'bottom', spotlightClicks: true }];
        } else if (path.startsWith('/proyectos') && path.split('/').length === 3 && !path.includes('/crear')) {
            key = 'projectDetail';
            nextSteps = [{ target: '.tour-tab-bugs', content: 'Ahora que entraste al proyecto, ve al "Tablero de Bugs" en el menú lateral.', placement: 'right', spotlightClicks: true }];
        } else if (path === '/proyectos') {
            key = 'projectList';
            nextSteps = [{ target: '.tour-project-card', content: 'Paso 2: Selecciona cualquier proyecto de la lista haciendo clic en él.', placement: 'bottom', spotlightClicks: true }];
        } else {
            key = 'global';
            nextSteps = [
                { target: 'body', content: '¡Bienvenido a PrimeBug! Haremos un recorrido rápido para enseñarte a reportar incidencias.', placement: 'center', disableBeacon: true },
                { target: '.tour-select-project', content: 'Paso 1: Ve a "Proyectos" en tu menú lateral para comenzar.', placement: 'right', spotlightClicks: true }
            ];
        }

        setCurrentTourKey(key);
        const target = nextSteps[0]?.target;
        
        if (target === 'body') {
            setCurrentSteps(nextSteps);
            setTimeout(() => setRunTour(true), 400); 
            return;
        }

        // ESPERA ACTIVA: Escanea el DOM hasta que la página termine de cargar
        let attempts = 0;
        const interval = setInterval(() => {
            if (document.querySelector(target)) {
                clearInterval(interval); 
                setCurrentSteps(nextSteps);
                setTimeout(() => setRunTour(true), 600); 
            } else if (attempts > 50) { 
                clearInterval(interval);
            }
            attempts++;
        }, 100);

        return () => clearInterval(interval);

    // 👇 Agregamos las dependencias del Guardián al useEffect
    }, [location.pathname, isFullyOnboarded, checkingData, currentTeam, hasProjects]);

    // 6. Callback para guardar progreso
    const handleJoyrideCallback = async (data) => {
        const { status, step } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            
            // Si el usuario saltó el tour, O si el globo que acaba de cerrar es el de Submit
            if (status === STATUS.SKIPPED || step?.target === '.tour-btn-submit') {
                setIsFullyOnboarded(true);
                setRunTour(false);
                try {
                    const userRef = doc(db, 'profiles', user.uid);
                    await updateDoc(userRef, { has_seen_onboarding: true });
                } catch (error) {
                    console.error("Error guardando estado del tour:", error);
                }
            } else {
                // Si terminó una etapa intermedia (le dio click a un botón), apagamos el tour temporalmente
                setRunTour(false);
            }
        }
    };

    // 👇 7. RESTRICCIÓN DE RENDERIZADO: Si falta algún requisito, se oculta y no interfiere
    if (isFullyOnboarded || checkingData || !currentTeam || !hasProjects) return null;

    return (
        <Joyride
            key={location.pathname}
            steps={currentSteps}
            run={runTour}
            continuous={true}
            showSkipButton={true}
            showProgress={true} // RECUPERAMOS EL CONTADOR (1/x)
            disableOverlayClose={true}
            floaterProps={{ disableAnimation: true }} 
            callback={handleJoyrideCallback}
            styles={{
                options: { primaryColor: '#4f46e5', textColor: '#334155', zIndex: 10000 },
                buttonNext: { backgroundColor: '#4f46e5', borderRadius: '8px', fontWeight: 'bold' },
                buttonSkip: { color: '#64748b' }
            }}
            locale={{
                back: 'Atrás',
                close: 'Cerrar',
                // TEXTO DINÁMICO: Solo dice Finalizar en el último paso real.
                last: currentTourKey === 'bugCreate' ? '¡Finalizar Tutorial!' : 'Entendido',
                next: 'Siguiente',
                skip: 'Saltar Tutorial',
            }}
        />
    );
};

export default OnboardingTour;