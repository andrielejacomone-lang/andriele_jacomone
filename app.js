import pg from 'pg';
import promptSync from 'prompt-sync';

const { Client } = pg;
const prompt = promptSync();

const client = new Client({
    host:     'localhost',  
    port:     5432,         
    user:     'postgres',  
    password: 'root',       
    database: 'almoxarifado_db' 
});

async function registrarSaidas() {
    try {
        
        await client.connect();
        console.log(' Conectado ao banco de dados com sucesso!\n');

        const novasSaidas = [
            ['2026-07-16', 3.00, 1], 
            ['2026-07-16', 5.00, 2], 
            ['2026-07-16', 2.00, 3]  
        ];

        console.log(' Iniciando o registro das 3 saídas');
        
        await client.query('BEGIN');

        for (const saida of novasSaidas) {
            const [data, quantidade, idProduto] = saida;

            const queryInserirSaida = `
                INSERT INTO "saida" ("data_final", "quantidade", "id_produto") 
                VALUES ($1, $2, $3);
            `;
            await client.query(queryInserirSaida, [data, quantidade, idProduto]);

            const queryAtualizarEstoque = `
                UPDATE "produto" 
                SET "quantidade_estoque" = "quantidade_estoque" - $1 
                WHERE "id_produto" = $2;
            `;
            await client.query(queryAtualizarEstoque, [quantidade, idProduto]);

            console.log(` Saída de ${quantidade} unidades registrada para o produto ID: ${idProduto}`);
        }
        await client.query('COMMIT');
        console.log('\n Todas as 3 saídas foram salvas e os estoques atualizados!');
        console.log('POSIÇÃO ATUAL DO ESTOQUE (VIEW)');
        const resultadoEstoque = await client.query('SELECT * FROM "vw_estoque" ORDER BY "id_produto";');
        console.table(resultadoEstoque.rows);

    } catch (erro) {
       
        await client.query('ROLLBACK');
        console.error(' Erro durante o processo:', erro.message);
    } finally {
        
        await client.end();
        console.log('\n Conexão encerrada.');
    }
}

registrarSaidas();
