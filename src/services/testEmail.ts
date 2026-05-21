import { sendObligationAlert } from './emailService';

/**
 * Función de prueba para enviar un email de prueba
 * Llama a esta función desde la consola del navegador o desde un componente
 */
export async function sendTestEmail() {
    const testEmail = prompt('Ingresa tu email para recibir el email de prueba:');
    
    if (!testEmail) {
        console.log('Email cancelado');
        return;
    }

    try {
        console.log('📧 Enviando email de prueba...');
        
        await sendObligationAlert({
            to: testEmail,
            userName: 'Usuario de Prueba',
            obligationName: 'Obligación de Prueba - Habilitación Comercial',
            daysUntilDue: 7,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });

        console.log('✅ Email de prueba enviado exitosamente!');
        alert('✅ Email de prueba enviado exitosamente! Revisa tu bandeja de entrada.');
    } catch (error) {
        console.error('❌ Error enviando email de prueba:', error);
        alert('❌ Error enviando email: ' + (error as Error).message);
    }
}

// Hacer la función disponible globalmente para poder llamarla desde la consola
if (typeof window !== 'undefined') {
    (window as any).sendTestEmail = sendTestEmail;
}
