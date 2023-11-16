import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Hash from '@ioc:Adonis/Core/Hash'
import Database from '@ioc:Adonis/Lucid/Database'
import Env from '@ioc:Adonis/Core/Env'
import jwt from 'jsonwebtoken'


export default class ColaboradorsController {

    //Usuário Adm solicita todos os colaboradores (não retorna aqueles que estão desativados)
    public async SelecionaColaboradores({response}:HttpContextContract){
       try {
        const users = await Database
        .from('colaboradores')
        .where('deletado',false) 
        .select('nome_completo','email','departamento','matricula')
        
        response.ok({
            response: users}) 
       } catch (error) {
        response.unauthorized({
            response:'Erro ao pesquisar'})
       }
        
    }

    //Usuário Adm Insere um novo colaborador no sistema
    public async InsereColaborador({request, response}:HttpContextContract) {
        const data = request.body()
        try {
            await Database
            .table('colaboradores') 
            .insert({ 
                nome_completo : data.nome_completo,
                senha: await Hash.make(data.senha),
                email: data.email,
                deletado: false,
                departamento: data.departamento 
            })

            response.ok({
                response : data })
        } catch (error) {
            response.unauthorized({
                response:'Erro ao inserir colaborador'})
        }
    }

    //Usuário Adm altera dados do colaborador
    public async AlteraDadosDoColaborador({request,response}:HttpContextContract){
        const data = request.body()
        try {
            await Database
            .query()
            .from('colaboradores')
            .where('matricula', data.matricula)
            .update({ 
                nome_completo : data.nome_completo,
                email: data.email,
                departamento: data.departamento 
            })
            response.ok({
                response : "Dados alterados"
            })
        } catch (error) {
            response.unauthorized({
                response: 'Erro ao atualizar dados'})
        }
        
    }

    //Usuário Adm desativa colaborador
    public async DesativaColaborador({request, response}:HttpContextContract){
        const data = request.body()
        try {
            await Database
            .query()
            .from('colaboradores')
            .where('matricula', data.matricula)
            .update({ 
                deletado: true,
            })
            response.ok({
                response: 'Colaborador deletado'
            })
        } catch (error) {
            response.unauthorized({
                response: 'Erro ao excluir'})
        }
        
    }

    //Login Colaborador e usuário Adm
    public async Login({request,response}:HttpContextContract){
        const data = request.body()
        try{
            var dados = await Database
                .query()
                .from('colaboradores')
                .where('email', data.email)
                .select('senha','matricula','nome_completo')

            if (await Hash.verify(String(dados[0].senha),data.senha)){
                const token = jwt.sign({
                        userId: dados[0].matricula,
                        userName: dados[0].nome_completo
                       }, Env.get('JWT_PASSWORD'));
                return { token: token }
            }
        }catch(error){
            response.unauthorized()
        }
    }

    //Colaborador logado solicita a troca de senha
    public async AlteraSenha({request, response, params}:HttpContextContract){
        const data = request.body()
        const dadosUsuario = params.userData //Aqui retorna o payload

        var hashSenha = await Database
        .query()
        .from('colaboradores')
        .where('matricula', dadosUsuario.userId)
        .select('senha')
        console.log(hashSenha)
        try {
            if (await Hash.verify(hashSenha[0].senha,data.senha)){
                response.forbidden({response:'Senha igual a atual'})
            }else{
                await Database
                .query()
                .from('colaboradores')
                .where('matricula', dadosUsuario.userId)
                .update({ 
                    senha: await Hash.make(data.senha),
                })  
                response.ok({response:'Senha alterada'})
            }
        } catch (error) {
            console.log(error)
            response.unauthorized({
                response: 'Erro ao alterar senha'})
        }
    }

    //Colaborador solicita seus dados de cadastro
    public async CadastroColaborador({params, response}:HttpContextContract){
        const data = params.userData        
        try{
            const user = await Database
                .query()
                .from('colaboradores')
                .where('matricula', data.userId)
                .select('nome_completo','email','departamento','criado_em')
            response.ok({
                response: user
            }) 
        } catch (error){
            response.unauthorized({
                response:'Erro ao obter cadastro'})
        }
    }
}
