import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Download público de certificado
 * Redireciona para a rota que usa geração dinâmica via hook
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Buscar certificado em legacy_certificates
    const { data: certificate, error: legacyError } = await supabase
      .from('legacy_certificates')
      .select('*')
      .eq('id', id)
      .single()

    if (!legacyError && certificate) {
      // Retornar HTML que automaticamente faz download via client-side
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Download Certificado</title>
          <script src="https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js"></script>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .loading { font-size: 18px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h2>Preparando seu certificado...</h2>
          <div class="loading">Aguarde, o download será iniciado automaticamente.</div>
          
          <script>
            // Dados do certificado
            const certificateData = {
              studentName: "${certificate.student_name}",
              studentCpf: "${certificate.cpf}",
              courseName: "${certificate.course_name}",
              teacherName: "${certificate.teacher_name}",
              completionDate: "${new Date(certificate.completion_date).toLocaleDateString('pt-BR')}",
              certificateId: "${certificate.id}",
              courseHours: 40
            };
            
            // Criar PDF simples
            setTimeout(() => {
              const { jsPDF } = window.jspdf;
              const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm', 
                format: 'a4'
              });
              
              // Título
              pdf.setFontSize(24);
              pdf.text('CERTIFICADO DE CONCLUSÃO', 148, 50, { align: 'center' });
              
              // Nome do estudante
              pdf.setFontSize(20);
              pdf.text('Certificamos que', 148, 80, { align: 'center' });
              
              pdf.setFontSize(22);
              pdf.text(certificateData.studentName.toUpperCase(), 148, 100, { align: 'center' });
              
              // CPF
              pdf.setFontSize(14);
              pdf.text('CPF: ' + certificateData.studentCpf, 148, 115, { align: 'center' });
              
              // Curso
              pdf.setFontSize(18);
              pdf.text('concluiu com aproveitamento o curso', 148, 135, { align: 'center' });
              pdf.text('"' + certificateData.courseName + '"', 148, 155, { align: 'center' });
              
              // Detalhes
              pdf.setFontSize(14);
              pdf.text('ministrado por ' + certificateData.teacherName, 148, 175, { align: 'center' });
              pdf.text('em ' + certificateData.completionDate, 148, 190, { align: 'center' });
              
              // ID do certificado
              pdf.setFontSize(10);
              pdf.text('Certificado ID: ' + certificateData.certificateId, 148, 205, { align: 'center' });
              
              // Download
              pdf.save('certificado-' + certificateData.certificateId + '.pdf');
              
              // Fechar aba após 3 segundos
              setTimeout(() => {
                window.close();
              }, 3000);
            }, 1000);
          </script>
        </body>
        </html>
      `;
      
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // Se não encontrou em legacy_certificates, tentar certificados_antigos
    const { data: oldCert, error: oldError } = await supabase
      .from('certificados_antigos')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (!oldError && oldCert) {
      // Se tem certificate_url, redirecionar para ele
      if (oldCert.certificate_url) {
        return NextResponse.redirect(oldCert.certificate_url)
      }
      
      // Gerar HTML para certificados antigos
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Download Certificado</title>
          <script src="https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js"></script>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .loading { font-size: 18px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h2>Preparando seu certificado...</h2>
          <div class="loading">Aguarde, o download será iniciado automaticamente.</div>
          
          <script>
            const certificateData = {
              studentName: "${oldCert.student_name}",
              studentCpf: "${oldCert.cpf}",
              courseName: "${oldCert.course_name}",
              teacherName: "${oldCert.teacher_name}",
              completionDate: "${new Date(oldCert.data_conclusao).toLocaleDateString('pt-BR')}",
              certificateId: "${oldCert.id}",
              courseHours: ${oldCert.workload || 40}
            };
            
            setTimeout(() => {
              const { jsPDF } = window.jspdf;
              const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
              });
              
              pdf.setFontSize(24);
              pdf.text('CERTIFICADO DE CONCLUSÃO', 148, 50, { align: 'center' });
              
              pdf.setFontSize(20);
              pdf.text('Certificamos que', 148, 80, { align: 'center' });
              
              pdf.setFontSize(22);
              pdf.text(certificateData.studentName.toUpperCase(), 148, 100, { align: 'center' });
              
              pdf.setFontSize(14);
              pdf.text('CPF: ' + certificateData.studentCpf, 148, 115, { align: 'center' });
              
              pdf.setFontSize(18);
              pdf.text('concluiu com aproveitamento o curso', 148, 135, { align: 'center' });
              pdf.text('"' + certificateData.courseName + '"', 148, 155, { align: 'center' });
              
              pdf.setFontSize(14);
              pdf.text('ministrado por ' + certificateData.teacherName, 148, 175, { align: 'center' });
              pdf.text('em ' + certificateData.completionDate, 148, 190, { align: 'center' });
              
              pdf.setFontSize(10);
              pdf.text('Certificado ID: ' + certificateData.certificateId, 148, 205, { align: 'center' });
              
              pdf.save('certificado-' + certificateData.certificateId + '.pdf');
              
              setTimeout(() => {
                window.close();
              }, 3000);
            }, 1000);
          </script>
        </body>
        </html>
      `;
      
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // Certificado não encontrado
    return NextResponse.json(
      { error: 'Certificado não encontrado' },
      { status: 404 }
    )

  } catch (error) {
    console.error('Erro ao gerar certificado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}