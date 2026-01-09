import { getDatabase } from '../config/database';
import { User } from '../types';

async function setAdminByEmail(email: string) {
  try {
    const db = await getDatabase();
    const collection = db.collection<User>('users');

    // Buscar usuário
    const user = await collection.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`❌ Usuário com email ${email} não encontrado no banco de dados.`);
      console.log('💡 Certifique-se de que você já fez login pelo menos uma vez para criar o usuário.');
      console.log('💡 Ou faça login novamente - o sistema agora configura automaticamente este email como admin.');
      return false;
    }

    // Verificar se já é admin
    if (user.role === 'admin') {
      console.log(`ℹ️  Usuário ${email} já é admin.`);
      return true;
    }

    // Atualizar para admin
    const result = await collection.updateOne(
      { email: email.toLowerCase() },
      { 
        $set: { 
          role: 'admin',
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Usuário ${email} atualizado para admin com sucesso!`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Nome: ${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Não informado');
      return true;
    } else {
      console.log(`⚠️  Nenhuma alteração foi feita.`);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    return false;
  } finally {
    process.exit(0);
  }
}

// Executar script
const email = process.argv[2] || 'tiagosousa.tams@hotmail.com';
console.log(`🔧 Configurando ${email} como admin...`);
setAdminByEmail(email);
