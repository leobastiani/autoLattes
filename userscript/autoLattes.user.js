// ==UserScript==
// @id              autoLattes
// @namespace       https://github.com/leobastiani/autoLattes
// @version         0.0.1
// @author          Leonardo Guarnieri de Bastiani <leonardo.bastiani@usp.br>
// @name            autoLattes
// @description     autoLattes Descrição
// @include         https://wwws.cnpq.br/cvlattesweb/PKG_MENU.menu?f_cod=*
// @icon            https://raw.github.com/YePpHa/YouTubeCenter/master/assets/icon48.png
// @icon64          https://raw.github.com/YePpHa/YouTubeCenter/master/assets/icon64.png
// @license         NAP-SOL
// @require         https://code.jquery.com/jquery-3.1.1.min.js
// @noframes
// ==/UserScript==

/******************************************************
 * Inject
 ******************************************************/
var execFunctionGlobal = function (fn) {
    var s = document.createElement('script');
    s.innerHTML = '('+fn+'());';
    document.body.appendChild(s);
}

execFunctionGlobal(function() {




/******************************************************
 * Variáveis e constantes
 ******************************************************/
var TEST = {
    enabled: false,

    prodBib: {
        click1: true,
        click2: true,
    },
};

var DEBUG = {
    enabled: true,

    // mensagens do tipo alert
    debugMsg: false,

    // aciona o debugger que está dentro da debug
    debug_is_debugger: false,
};

example = {
    lattesUrl: 'http://buscatextual.cnpq.br/buscatextual/visualizacv.do?id=K4767859T8',
    doi: 'http://dx.doi.org/10.1016/j.infsof.2016.04.003',
    ISSN: '1234-5675',
}

autoLattes = {

    // tudo relacionada a mensagem atual
    // ou mensagens trocadas
    Msg: {
        // tudo relacionado as Msgs
        this: {}, // mensagem atual
        src: {}, // mensagem original
        all: [], // todas as mensagens

        // reseta a mensagem para ser vazia
        reset: function () {
            debug('autoLattes.Msg.reset()');

            var hasMenuClick = this.this !== null && 'menuClick' in this.this;

            if(hasMenuClick) {
                // preserva o menuClick
                var menuClick = this.this.menuClick;
            }

            // mensagem original
            this.this = {};
            this.src = this.this;

            if(hasMenuClick) {
                this.this.menuClick = menuClick;
            }
        },

        // salva a mensagem
        save: function () {
            if(autoLattes.Writer.msg) {
                // se estou no modo escrita
                // cheguei no final e devo parar
                autoLattes.Writer.stop();
            }

            // como salvar a msg
            debug('Mensagem salva: ', autoLattes.srcMsg);

            // adicionando a msg ao menu
            // digo que a próxima mensagem, não fará nada
            // this.this.msg = null;

            // atalho para a mensagem raiz
            var msg = this.src;
            
            // neste ponto, eu salvo a mensagem raiz com final
            // o próximo ponteiro para null
            // para que não tenha ação após ela
            this.all.push(msg);

            // reseto a mensagem
            autoLattes.Msg.reset();


            // remove aquela mensagem de q nd foi alterado
            $('#autoLattes-semAlteracoes').remove();

            // faço um html para a msg aparecer
            var elem = $('<a>'+autoLattes.Msg.nome(msg)+'</a>');
            elem.css({
                display: 'block',
                cursor: 'pointer',
                textDecoration: 'underline',
                color: 'red',
                fontWeight: 'bold',
            });
            elem.appendTo('#autoLattes-msgs');
            elem.click(function(event) {
                autoLattes.File.write('autoLattes', msg);
            });
        },


        nome: function(msg) {
            msg = msg !== undefined ? msg : this.src;

            var data = new Date();
            var timeStr = data.getHours() + ':' + data.getMinutes() + ':' + data.getSeconds();

            return 'Alteração em '+timeStr;
        },


    },


    // Objeto Writer, tudo relacionado com a escrita do autoLattes
    Writer: {
        // mensagem atual do writer
        msg: null, // será um dict quando existir
        btn: $('<button id="autoLattes-writer-msg">Insira a partir de um arquivo.</button>'),
        // aqui estão os elementos que vou slecionar
        // qndo qro salvar ou escrever neles
        selectors: 'input, select, textarea',

        do: function () {
            // se não tem mensagem, não faz nada
            if(!autoLattes.Writer.msg) {
                return ;
            }

            // neste ponto, objeto modal já está definido
            

            var msg = autoLattes.Writer.msg;

            // se estou num iframe
            if($(autoLattes.Modal.this).is('iframe')) {

                // se tem botão de adicionar
                if($('.adicionar:visible').length) {
                    return $('.adicionar').click();
                }

            }



            if(autoLattes.Modal.name == msg.name) {
                // estou na janela correta! vamos preencher os campos
                autoLattes.Writer.vals(function () {
                    // caminho com a mensagem
                    autoLattes.Writer.msg = msg.msg;
                });
            }


        },


        stop: function () {
            // quando eu devo parar de escrever (autoLattes.Writer)
            autoLattes.Writer.msg = null;
        },


        /**
         * preenche um item do modal
         * index pode ser o nome do campo do componente
         */
        val: function (index, val, cb) {
            var $ = autoLattes.Modal.$;

            var elems = autoLattes.Modal.find(autoLattes.Writer.selectors);
            var elem = null;

            // obtendo o elemento no meio de todos elems
            if(typeof index === "number") {
                elem = elems.eq(index);
            }
            else {
                // tento encontrar pelo seu nome

                // tem alguns restrições
                // o nome deve ser composto apenas por
                // alphanumericos
                // do começo ao fim
                if(index.match(/^\w+$/)) {
                    elem = $('[name='+index+']');
                    if(elem.length == 0) {
                        elem = null;
                    }
                }
            }


            if(elem == null) {
                // ainda não encontrei esse elem =/
                elems.each(function() {
                    var text = $(this).parent().text().trim();
                    var matches = text.match(/(.*?)\s{4,}/);
                    if(matches) {
                        text = text.match(/(.*?)\s{4,}/)[1];
                    }
                    if(text == index) {
                        elem = $(this);
                        return false;
                    }
                });
                if(elem === null) {
                    throw Error('Input "'+index+'" não encontrado.');
                }
            }

            if(val === undefined) {
                return elem;
            }

            // realiza processos de blur
            // devo clicar nele primeiro
            elem.click();
            // digitar a informação
            elem.val(val);
            // funcões que devo chamar
            var fns = ['onblur'];
            fns.forEach(function (fn, index) {
                if(elem[0][fn]) {
                    elem[0][fn].apply(elem);
                }
            });
            
            // chamo o callback
            // se todas as requisições ajax foram concluidas
            autoLattes.Modal.ajax(cb);
        },


        vals: function (cb) {
            // nessa função, sempre marco um elemento
            // e chamo ela de novo

            // primeiro, tenta inserir
            // os valores de val
            var val = autoLattes.Writer.msg.val.val;

            if(val && val.length) {
                // tenho valores para inserir
                // retira um comando
                var command = val.shift();
                // preenche ele
                autoLattes.Writer.val(command.name, command.val, function () {
                    autoLattes.Writer.vals(cb);
                });
                // já preenchi aqui
                return ;
            }

            // neste ponto
            // já devo ter preenchido todos os val
            
            // preencho os radios
            var radios = autoLattes.Writer.msg.val.radio;

            if(radios && radios.length) {
                // só achar esse elemento
                // e marcar ele
                var command = radios.shift();
                $('input[name='+command.name+'][value="'+command.val+'"]').attr('checked', true);
                // só chamar a recursão
                autoLattes.Writer.vals(cb);
                // já removi um elemento, posso sair
                return ;
            }


            var gridWrappers = autoLattes.Writer.msg.val.gridWrapper;
            // TODO: remover && false
            if(gridWrappers && gridWrappers.length && false) {
                // se mudei algo, devo sair dps
                var exit = false;
                // todas as gridWrappers
                var allGws = autoLattes.Modal.GridWrappers();
                allGws.each(function(index, el) {
                    // para cada gws, vejo se ele está na tabela de
                    // gridWrappers que devo fazer uma inserção
                    var gws = this;
                    gridWrappers.forEach(function (elem, index) {
                        if(gws.nome == elem.nome) {
                            if(!elem.val.length) {
                                // não tem elementos
                                return false;
                            }
                            // encontrei
                            // pra cada elem.val
                            // insiro em gws.input
                            var val = elem.val.shift();
                            var input = $(gws.$).find(gws.input.selector);
                            gws.input.val(val);
                            // tem q dar dois
                            gws.input.trigger('accept');
                            // devo sair dps
                            exit = true;
                            // pode ser que apareça uma janela de confirmação
                            // tenta confirmar
                            autoLattes.Modal.$('.botao.salvar:not(.autoLattes):visible').last().click();
                            setTimeout(function () {
                                autoLattes.Writer.vals(cb);
                            }, 100);
                            return false;
                        }
                    });
                });
                if(exit) {
                    return ;
                }
            }


            // agr só falta os checkboxes
            var checkboxes = autoLattes.Writer.msg.val.checkbox;
            if(checkboxes && checkboxes.length) {
                // esse aqui é diferente, pego todos os checkboxes
                // vejo se ele está dentro de checkboxes
                // se estiver, marco ele
                // se não, desmarco
                $('input[type=checkbox]').each(function(index, el) {
                    var name = $(this).attr('name');
                    if($.inArray(name, checkboxes) != -1) {
                        // ele está na lista
                        // deve ser marcado
                        $(this).attr('checked', true);
                    }
                    else {
                        // não tá na lista
                        $(this).attr('checked', false);
                    }
                });

                // finjo que já marquei todos
                // deixando a lista vazia
                autoLattes.Writer.msg.val.checkbox = [];
            }

            // marquei tudo oq tinha q marcar
            // posso sair
            return cb();
        },


        menuClick: function (menu) {

            var elem = $('.megamenu a').filter(function(index) {
                return $(this).text() == menu;
            }).first();
            elem.click();

            return this;
        },
    },

    Modal: {
        name: '', // nome do modal corrente
        this: document, // ponteiro do modal corrente
        $: window.jQuery, // jquery do modal corrente
        find: window.jQuery, // função de encontrar do modal em questão

        isLastDiv: function() {
            return this.$('.areaSelecao:visible').length >= 1;
        },


        /**
         * Função que pega
         * os valores dos elementos da tela
         *
         * retorna um dict que vai dentro da mensagem
         */
        read: function () {
            var isVisible = function (elem, type) {
                type = type !== undefined ? type : $(elem).attr('type');

                // começa aqui outra parte
                // agora eu devo retirar os invisiveis
                // mas se ele for hidden, ai eu deixo ele passar
                if(type == 'hidden') {
                    return true;
                }
                // agr se ele for invisível, não passará
                if(!$(elem).is(':visible')) {
                    return false;
                }

                return true;
            }

            var res = {};
            var $ = autoLattes.Modal.$;

            // vamos tratar os elementos
            // que são definidos pela função do
            // jquery .val

            // vamos ver esses elementos
            var excludeTypes = ['radio', 'checkbox'];
            var elems = $('input, select, textarea').filter(function(index) {
                var name = $(this).attr('name');
                if(!name) {
                    // nem nome ele tem
                    return false;
                }
                
                // não quero elementos que
                // não tem nada dentro
                if($(this).val() == '') {
                    return false;
                }


                var type = $(this).attr('type');
                if(type === undefined) {
                    // deixa ele ai
                    return true;
                }
                if($.inArray(type, excludeTypes) != -1) {
                    // ele está dentro de excludeTypes
                    return false;
                }


                if(!isVisible(this, type)) {
                    // não é visivel
                    return false;
                }


                // não entrou em nenhuma categoria
                // deixa passar
                return true;
            });


            // aqui temos em elem
            // vários elementos com nome
            // e valores que vamos definir
            var vals = [];
            elems.each(function(index, el) {
                vals.push({
                    name: $(this).attr('name'),
                    val: $(this).val(),
                });
            });
            if(vals.length) {
                res['val'] = vals;
            }


            // agora, vamos colocar os checkbox e os radios
            // que estão assinalados
            var assinalaveis = $('input[type=checkbox], input[type=radio]').filter(function(index) {
                if(!isVisible(this, 'checkbox')) {
                    return false;
                }

                // ok, ele é visivel
                // agr eu qro saber
                // se ele está ativado
                if($(this).is(':checked')) {
                    // sim, ele está ativo
                    return true;
                }
                // não, ele está inativo
                // nem preciso salvar ele
                return false;
            });

            // agora eu separo
            // o que checkbox
            // e o que é radio
            var checkboxes = [];
            var radios = [];
            assinalaveis.each(function(index, el) {
                var name = $(this).attr('name');
                if($(this).is('[type=checkbox]')) {
                    checkboxes.push(name);
                }
                if($(this).is('[type=radio]')) {
                    // aqui, eu tenho q adicionar
                    // o nome e seu valor
                    radios.push({
                        name: name,
                        val: $(this).val(),
                    });
                }
            });

            // adiciono eles
            // ao res
            if(checkboxes.length) {
                res['checkbox'] = checkboxes;
            }
            if(radios.length) {
                res['radio'] = radios;
            }



            // agora vamos tratar
            // as tabelas do tipo sugests
            // que são encontradas na utlima tela
            // de
            // Produções > Artigos completos publicados em periódicos
            // vamos fazer esse procedimento para cada tabela
            var gridWrappers = [];
            autoLattes.Modal.GridWrappers().each(function(index, el) {
                if(!this.input.length) {
                    // se não input
                    // não preciso guardar seus valores
                    return true;
                }

                // se n tem nenhum valor
                // n preciso guardar
                if(this.valores.length == 0) {
                    return true;
                }

                // preciso guardar seus valores
                gridWrappers.push({
                    nome: this.nome,
                    val: this.valores,
                });
            });

            if(gridWrappers.length) {
                res['gridWrapper'] = gridWrappers;
            }



            return res;
        },

        GridWrappers: function () {
            return autoLattes.Modal.$('.grid-wrapper').map(function(index, elem) {
                return new autoLattes.Modal.GridWrapper(this);
            });
        },

        GridWrapper: function (self) {
            var $ = autoLattes.Modal.$;
            this.$ = self;
            this.input = $(self).find('.suggest-wrapper input');
            // o nome é a primeira linha, segunda coluna
            // a primeira coluna é a ordem
            this.nome = $('.grid-wrapper').eq(0).find('th').eq(1).text();

            // todas as colunas
            var colunas = $(self).find('.cell-wrapper');
            // aqui eu remova a ultima coluna
            this.colunas = [];
            // valores da coluna
            this.valores = [];
            // este objeto
            var gw = this;
            colunas.each(function(index, el) {
                if(colunas.length-1 == index) {
                    return false;
                }

                if($(this).find('img').length) {
                    // encontrei uma imagem
                    // deve ser a imagem da lixeira
                    // não estou interessado
                    return true;
                }
                var text = $(this).text();
                if(text == '') {
                    // tmb n estou interessado
                    return true;
                }

                // só remove o ultimo
                gw.colunas.push($(this));
                gw.valores.push(text);
            });

        },


        // essa função chama cb quando
        // todas as requisições ajax foram concluidas
        ajax: function (cb) {
            if(!cb) {
                return ;
            }

            var $ = autoLattes.Modal.$;
            // quantidade de requisições ativas
            if($.active == 0) {
                return cb();
            }

            
            // tem requisição ajax
            // me chamo

            // faço uma requisição ajax
            // pq tem uma ativa

            $($.document).one('ajaxComplete', function (e, xhr, opt) {
                // se requisições em ajax
                $.active--; // simula a remoção de um active
                autoLattes.Modal.ajax(cb);

                // tenho que somar de novo
                // pq o jquery vai subtrair esse valor posteriormente
                $.active++;
            });
        }
    },

};






/******************************************************
 * autoLattes
 ******************************************************/
var documentReady = function() {

    autoLattes.Msg.reset();


    // objeto autoLattes
    autoLattes.div = $('<div id="autoLattes">').appendTo($('.cont').first());
    // vamos adicionar agr o CSS
    var initialOpacity = 0.5;
    autoLattes.div.css({
        position: 'absolute',
        right: '10px',
        top: '10px',
        background: '#FFF',
        width: '200px',
        minHeight: '150px',
        opacity: initialOpacity,
        textAlign: 'center',
        transition: 'opacity 0.2s',
    });
    // aumenta a opacidade qndo o mouse tá sobre ele
    autoLattes.div.mouseover(function(event) {
        $(this).css('opacity', 1);
    }).mouseout(function(event) {
        $(this).css('opacity', initialOpacity);
    });

    autoLattes.div.html('<h3 style="color: red;">autoLattes</h3><br>');

    autoLattes.div.append(autoLattes.Writer.btn);
    autoLattes.div.append('<div style="margin-top: 10px;">Alterações feitas até o momento: <div id="autoLattes-msgs"><span id="autoLattes-semAlteracoes" style="color: purple; font-weight: bold;">Por enquanto, nada foi alterado em seu Lattes.</span></div> </div>');

    autoLattes.Writer.btn.click(function(e) {
        autoLattes.File.readJson(function (msg) {
            autoLattes.Writer.msg = msg;

            if('menuClick' in msg) {
                // devo clicar nele
                autoLattes.Writer.menuClick(msg.menuClick);
            }
        });
    });



    // callback do modal de edição
    var onModal = function (e, name, $) {
        // para depuração, posso usar j ao invés de $
        // posso remover depois
        j = $;

        debug('onModal', this);

        // define as opções do Modal
        autoLattes.Modal.name = name;
        autoLattes.Modal.this = this;
        autoLattes.Modal.$ = $;


        // adiciona a classe autoLattes pra saber se já foi processado
        if($(this).find('form').length) {
            // tem um form
            var f = $(this).find('form:eq(0)');
            if(f.hasClass('autoLattes')) {
                return ;
            }
            f.addClass('autoLattes');
        }


        // devo informar o Msg.reset para o botão adicionar
        var adicionarBtn = $('.adicionar');
        adicionarBtn.click(function(e) {
            autoLattes.Msg.reset();
        });

        



        // msg atual que estamos trabalhando, para n ter q ficar digitando "autoLattes."
        var msg = autoLattes.Msg.this;
        var self = this;
        // função find dentro do modal
        autoLattes.Modal.find = function(sel) { return $(self).is('iframe') ? $.apply(self, arguments) : $(self).find.apply($(self), arguments); };


        // se estou trabalhando com outro jQuery
        // tenho q implementar umas funções que estão aqui, mas não estão no outro
        if(jQuery !== $) {
            // estou trabalhando com outro jQuery
            var firstFn = window.jQueryFn.t[(function() {for(k in window.jQueryFn.t) return k}())];
            if(!(firstFn.name in $.fn)) {
                // extendo o jquery
                window.$fn($);
            }

            // agora faço oq tenho q fazer utilizando esse cara
            window.$ = $;
            // dps volto ele no final
        }


        if($('.botao.salvar:not(.autoLattes):visible').length && !$('.botao.excluir:visible').length) {
            // se estou em um lugar onde devo salvar o que está sendo inserido

            // começo trabalhando com a mensagem
            msg['name'] = name;
            // próximo msg
            msg['msg'] = {};

            // trabalhando com o botão de salvar
            $('.botao.salvar:not(.autoLattes):visible')
                .onFirst('click', function (e) {
                    // função do click
                    // antes dos inputs sairem
                    // para ler o que tem e cada input
                    debugMsg('Botão SALVAR clicado, antes de mudar.');

                    // vamos começar a coleta de informações
                    // primeiro, reseto os valores
                    msg.val = autoLattes.Modal.read();
                })
                .bind('click', function(e) {
                    // o que acontece dps
                    // do click
                    // para entender a próxima página

                    debugMsg('Botão SALVAR clicado, depois de mudar.');

                    // a última div, tem barra de navegação do lado
                    if(!autoLattes.Modal.isLastDiv()) {
                        // não estou na ultima div, ou seja
                        // vale essa regra para saber se posso continuar
                        if($('input:visible').length) {
                            // ainda tem elementos input visiveis
                            // não enviou o form
                            return ;
                        }   
                    }
                    else {
                        // estou na última div
                        // ou seja, para saber se posso continuar, n pode haver erros na tela
                        if(jQuery('.caixaMsg:visible').length) {
                            // se possuir alguma caixa de msg, eu preciso fazer alguma alteração antes de continuar
                            return ;
                        }

                        // informo ao sistema que cheguei no final, e posso salvar a msg
                        autoLattes.Msg.save();
                    }

                    // nesse momento
                    // devo ir para a próxima mensagem
                    autoLattes.Msg.this = msg['msg'];
                })
                // para sabermos que já processei esse botão
                .addClass('autoLattes');
                // fim do botão de salvar


        } // fim se houver botão salvar


        // aqui eu detecto sempre q for inserido um pesquisador
        // no campo de sugestão
        // suggest-wrapper
        if($(this).is('iframe')) {

            // a função chamaUrl é um ajax
            // que não utiliza os meios de ajax pelo jQuery
            // vamos mudar a função para definir que todas
            // as chamadas de ajax sejam pelo jQuery
            var win = $(this).window();
            if(win.chamaUrl) {
                win.chamaUrl = function (arg) {
                    win.$.get(arg, function(data) {
                        // vamos encapsular o eval
                        // pq o this deve ser o window
                        // em que ele está
                        var s = win.document.createElement('script');
                        s.innerHTML = '(function(){'+data+'}());';
                        win.document.body.appendChild(s);
                    });
                    return false;
                }
            }


            var doc = $(this).document();            

            /*$(doc).on('edit', 'body', function(e) {

                // vamos pegar os inputs
                // de suggest-wrapper
                var input = $('.suggest-wrapper input:not(.autoLattes)').addClass('autoLattes');
                var events = input.events('accept');
                var handler = events[0].handler;

                // vamos sobreescrever esse handler
                events[0].handler = function () {
                    // é a tabela que ele está associado
                    var gridWrapper = $(this).parents('.grid-wrapper');

                    // por enquanto não vou fazer mais nada
                    handler.apply(this, arguments);
                };

            });*/

        }


        autoLattes.Writer.do(this);


        // volto o $ ao original
        window.$ = jQuery;


        // após terminar todos os passos da função modal
        // devo chamar a próxima função de test
        test.onModal();

    } // onModal




    // agora eu tenho q implementar quando chamar essa função
    $.onLoad('iframe[src]:visible', function (e) {
        // nome pela div superior
        var name;
        try {
            name = $.trim($('.modal:visible .superior_central').last().clone().contents().text());
        } catch(e) {
            name = '';
        }

        // verifico aqui se posso chamar a função onModal
        var possoPassar = (function () {
            // se só há um modal, posso passar
            var modais = $('.modal_holder:visible');
            if(modais.length == 1) {
                return true;
            }

            // se há mais de um modal
            // se o modal atrás dele tem o botão adicionar
            // ou seja, o penultimo
            // posso passar
            var penultimoModal = modais.eq(modais.length-2);

            var iframePenultimo = penultimoModal.find('.iframe');
            if(iframePenultimo.length) {
                if(iframePenultimo.contents().find('.adicionar').length) {
                    return true;
                }
            }

            // caso contrário
            return false;
        }());


        if(!possoPassar) {
            return ;
        }


        // podemos ter um modal dentro de um document
        // de um iframe
        (function($) {
            
            // jQuery do iframe
            $(document).on('ajaxStop', function() {
                // winWrapper é o modal que vêm de um ajaxStop
                var winWrapper = $('.win-wrapper:visible');

                if(!winWrapper.length) {
                    // se não hovuer winWrapper
                    return ;
                }

                debug('winWrapper', winWrapper);
                winWrapper.each(function(index, winWrapper) {
                    var $title = $(winWrapper).find('.win-title');
                    var title = $title.length ? $title.text() : '';
                    onModal.call(winWrapper, e, title, $);
                });
            });


            // fim do jQuery do iframe

        }($(e.target).jQuery()));

        
        onModal.call(e.target, e, name, $(e.target).jQuery());
    });



    // quando eu devo resetar a msg
    // por exemplo: Produção > Artigos completos publicados em periódicos
    // 
    // toda vez que clico num menu que está na barra de navegação, em cima
    // nos links a direita inferior
    /*$(document.body).on('click', '.megamenu li a', autoLattes.Msg.reset);
    $(document.body).on('click', '#list_example a', autoLattes.Msg.reset);*/
    $('.megamenu li a, #list_example a').click(function (e) {
        autoLattes.Msg.reset();

        var btnName = $(this).text();
        autoLattes.Msg.this.menuClick = btnName;
    });


}



/******************************************************
 * Misc
 ******************************************************/

// espera até uma condição ser verdadeira, quando for
// executa o callback
var repeatUntil = function (condicao, callback, usInterval) {
    var interval = setInterval(function() {
        if(condicao()) {
            callback();
            clearInterval(interval);
        }
    }, usInterval || 200);
}


// mesma que a de cima, só que esta espera um seletor existir
var repeatUntilExist = function (seletor, callback) {
    repeatUntil(new Function('return $(\''+seletor.replace(/'/gm, "\\'")+'\')'), callback);
}


var debug = function () {
    if(!isDebug()) {
        return ;
    }
    console.log.apply(this, arguments);
    if(DEBUG.debug_is_debugger) {
        debugger;
    }
}


var isDebug = function () {
    return DEBUG.enabled;
}

var elemTo$ = function (elem) {
    return function (s) { return $(elem).contents().find(s); };
}



/******************************************************
 * jQuery.Fn
 ******************************************************/
window.jQueryFn = {
    // funções com this
    t: {
        // preciso chamar um click antes da função onclick
        onclick: function (fn) {
            var clickFunc = $(this).prop('onclick');
            $(this).removeProp('onclick');
            $(this).click(fn);
            $(this).click(clickFunc);

            return this;
        },


        // são as funções que aquele evento possui
        handlers: function (event) {
            var events = $(this).events(event);

            return $.map(events, function(elem, index) {
                return elem.handler;
            });
        },


        // os eventos no botão
        events: function (event) {
            try {
                
                var result = this.data('events');
                if(typeof result !== 'object') {
                    result = $._data( this[0], "events" );
                    if(result !== 'object') {
                        return [];
                    }
                }


                if(event) {
                    result = result[event];
                }
                if(typeof result !== 'object') {
                    return [];
                }

                return result;

            } catch(e) {
                // por padrão retorna isso
                return [];
            }
        },


        // no caso dos inputs com suggest, devo chamar a função val
        // e mais algumas funções para poder enviar o suggest
        valSuggest: function () {
            // chama a função verdadeira
            var result = $(this).val.apply(this, arguments);

            if($(this).is('.suggest-wrapper input')) {
                $(this).trigger('accept');
            }

            return result;
        },



        onFirst: function (event, selector, fn) {
            // adiciona um evento
            $(this).on.apply(this, arguments);

            // coloca o ultimo evento em primero
            $(this).lastEventOnFirst(event);
            return this;
        },


        oneFirst: function (event, selector, fn) {
            // adiciona um evento
            $(this).one.apply(this, arguments);

            // coloca o ultimo evento em primero
            $(this).lastEventOnFirst(event);
            return this;
        },



        lastEventOnFirst: function (event) {
            // pega os eventos que ja estão setados
            var events = $(this).events(event);
            
            // agora eu pego o ultimo evento e coloco em primeiro
            var e = events.splice(-1, 1);
            events.splice(0, 0, e[0]);

            return this;
        },


        // obtem o $ do iframe
        jQuery: function () {
            return $(this).window().$;
        },


        window: function () {
            return $(this)[0].contentWindow;
        },

        document: function () {
            if($.document === undefined) {
                if($(this).is('iframe')) {
                    $.window = $(this)[0].contentWindow;
                    $.document = $.window.document;
                    $.window.test = window.test;
                }
                else {
                    // não é um iframe, n consigo determinar o document
                    throw new Error('Não foi possível determinar o document de ', $(this));
                }
            }

            return $.document;
        },


        // simula um click
        simulateClick: function ($) {
            $ = $ || jQuery;
            $(this).mousedown();
            if($(this)[0].onclick) {
                $(this)[0].onclick();
            }

            $(this).click();
            $(this).mouseup();
            return this;
        },


        // pega o seletor como é o feito no chrome
        // http://stackoverflow.com/questions/2068272/getting-a-jquery-selector-for-an-element
        getPath: function () {
            if (this.length != 1) throw 'Requires one element.';

            var path, node = this;
            while (node.length) {
                var realNode = node[0], name = realNode.localName;
                if (!name) break;
                name = name.toLowerCase();

                var parent = node.parent();

                var siblings = parent.children(name);
                if (siblings.length > 1) { 
                    name += ':eq(' + siblings.index(realNode) + ')';
                }

                path = name + (path ? '>' + path : '');
                node = parent;
            }

            return path;
        },

    },



    // funções sem this
    n: {
        // o .on('load') não tem funcionado nessa versão do jQuery, vou criar meu próprio
        // .on e .one
        onLoad: function (selector, fn) {
            document.body.addEventListener('load', function (e) {
                // tenho que tratar o iframe
                if(!$(e.target).is(selector)) {
                    return ;
                }

                fn(e);
            }, true);
        },
        oneLoad: function (selector, fn) {
            document.body.addEventListener('load', function (e) {
                // tenho que tratar o iframe
                if(!$(e.target).is(selector)) {
                    return ;
                }

                fn(e);

                document.body.removeEventListener('load', arguments.callee, true);
            }, true);
        },
    },

};


window.$fn = function ($) {
    $.fn.extend(window.jQueryFn.t);

    for(var e in jQueryFn.n) {
        $[e] = jQueryFn.n[e];
    }
}
window.$fn($);






/**
 * posso chamar o documentReady
 */
$(document).ready(function() {
    documentReady();
});


/******************************************************
 * Testes
 ******************************************************/
var debugMsg = function (msg) {
    if(!DEBUG.enabled) {
        return ;
    }

    if(!DEBUG.debugMsg) {
        return ;
    }

    if(TEST.enabled) {
        return ;
    }


    if(arguments.length > 0) {
        var args = Array.apply(null, arguments);
        msg = args.join('\n');

        alert(msg); 
    }
}


var test = function () {
    console.clear();

    // para cada test
    $.each(test.tests, function(index, val) {
        var t = new Test();
        val(t);
        t.do();
    });
}

// clica nos menus de cima
test.menuClick = function (name, cb) {
    test.onNextModal(cb);

    var elem = $('.megamenu a').filter(function(index) {
        return $(this).text() == name;
    }).first().click();
}

test.adicionar = function (cb) {
    test.onNextModal(cb);

    var $ = autoLattes.Modal.$;
    $('.adicionar:visible').click();
    return test;
}


// o próximo callback dos tests
test._onModal = [];
test.onNextModal = function (cb) {
    if(cb) {
        test._onModal.push(cb);
    }
    else {
        test._onModal.push(null);
    }
    return test;
}

// quando eu chamo o callback
test.onModal = function () {
    var cb = test._onModal.pop();

    if(cb) {
        cb.apply(this);
    }
}


test.val = function (index, val, cb) {
    autoLattes.Writer.val(index, val, cb);
}


test.confirm = function (cb) {
    var $ = autoLattes.Modal.$;

    test.onNextModal(cb);
    var btn = $('.botao.salvar:visible');
    if(btn.text() == 'Confirmar') {
        btn.click();
    }
    else {
        btn.find('a').click();
    }
    return test;
}

test.getDocument = function () {
    var $ = autoLattes.Modal.$;
    return $($.document);
}


test.sleep = function (interval, cb) {
    setTimeout(cb, interval);
    return test;
}

test.asserts = {};

test.asserts.qntMsg = function (dif, cb) {
    var qntMsg = autoLattes.Msg.all.length;

    if(arguments.length === 1) {
        return arguments.callee(undefined, arguments[0]);
    }

    if(dif === undefined) {
        // devo gravar a quantidade de mensagens
        test._qntMsg = qntMsg;
        cb();
        return test;
    }

    // se n, devo ver se a diferença é igual
    test.assert(qntMsg - test._qntMsg === dif);
    cb();
    return test;
}


test.assert = function (bool) {
    if(!bool) {
        debugger;
        throw new Error("autoLattes: Assert");
    }

    return test;
}


/**
 * CONFIRM
 * Confirm true e confirm false são funções que fazem a função confirm retornar
 * true or false
 * uma única vez de confirm
 */
window._confirm = window.confirm;
test.confirmTrue = function () {
    var w = autoLattes.Modal.$.window;
    w.confirm = function() {
        w.confirm = window._confirm;
        return true;
    };
}
test.confirmFalse = function () {
    var w = autoLattes.Modal.$.window;
    w.confirm = function() {
        w.confirm = window._confirm;
        return false;
    };
}


test.delete = function (index, cb) {
    index = index !== undefined ? index : 0;
    if(typeof index === "function") {
        cb = index;
        index = 0;
    }
    var $ = autoLattes.Modal.$;

    // clica na linha da tabela para se excluir
    $('.int tr').eq(index).click();
    test.onNextModal(function () {
        // haverá um confirm, devo retornar true nele
        test.confirmTrue();

        autoLattes.Modal.$('.botao.excluir a:visible').click();
        test.onNextModal(cb);
    });
}


test.ajax = function (cb) {
    autoLattes.Modal.ajax(cb);
    return test;
}

test.close = function (cb) {
    window.jQuery('.superior_direito:visible img').click();
    cb();
}


// todos os testes ficarão aqui
test.tests = {};

// classe de notação de testes
var Test = function () {
    // vou inserir no final
    // e remover do começo
    this.queue = new Array();
}

Test.prototype.do = function() {
    if(this.queue.length == 0) {
        // fila vazia
        return ;
    }

    var testDo = this.queue.shift();
    var args = testDo.args;
    
    // devo encontrar uma função com este nome
    var testFn = test[testDo.fn];
    while(typeof testFn === "object") {
        // nova função
        // puxo outro nome de função
        testFn = testFn[args.shift()];
    }

    // adiciona um cb a cada função
    // este cb deve ser com base neste this
    var self = this;
    function cb() {
        self.do();
    }
    args.push(cb);


    testFn.apply(test, args);
}

// uma ação de test
Test.TestDo = function (fn, args) {
    this.fn = fn;
    this.args = args;
}

Test.prototype.$ = function(fn) {
    var args;
    if(arguments.length == 1) {
        args = [];
    }
    else {
        var args = new Array(arguments.length-1);
        for(var i=1; i<arguments.length; i++) {
            args[i-1] = arguments[i];
        }
    }

    this.queue.push(new Test.TestDo(fn, args));

    return this;
}


test.tests.newProdBibliografica = function (test) {
    test
    .$('asserts', 'qntMsg')
    .$('menuClick', 'Artigos completos publicados em periódicos')
    .$('adicionar')
    .$('val', 0, example.doi)
    .$('confirm')
    .$('val', 0, example.ISSN)
    .$('val', 2, 1)
    .$('val', 3, 2)
    .$('val', 4, 3)
    .$('confirm')
    .$('val', 0, '10.1016/j.infsof.2016.04.003')
    // o primeiro ajax não faz nd
    // o segundo que vem coisa
    .$('val', 'Volume', '1')
    .$('val', 'Página inicial/ Número artigo eletrônico', '100')
    
    .$('confirm')
    // deve haver uma mensagem a mais
    .$('asserts', 'qntMsg', 1)
    .$('delete')
    .$('close');
    
}



if(TEST.enabled) {
    test();
}



// posso acessar o test de fora
window.test = test;




/******************************************************
 * FileAPI
 ******************************************************/
autoLattes.File = {
    ext: '.txt',

    write: function(file_name, content) {
        if(typeof content === "object") {
            content = JSON.stringify(content, null, 4);
        }
        var a = document.createElement('a');
        a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        a.setAttribute('download', file_name+this.ext);
        a.click();
    },


    read: function (cb) {
        // cria um inputFile para ser clicado
        var inputBtn = $('<input type="file" accept="'+this.ext+'">');
        
        inputBtn.on('change', function(e) {

            var files = e.target.files;
            var file = files[0];           
            var reader = new FileReader();
            reader.onload = function() {
                // aqui está o o conteudo que acabei de ler
                var data = this.result;

                cb(data);
            }

            reader.readAsText(file);
        });

        // por ultimo, clicamos no botao
        inputBtn.click();
    },


    readJson: function (cb) {
        // TODO: remover depois
        // return cb(JSON.parse('{"menuClick":"Artigos completos publicados em periódicos","name":"Incluir novo artigo","msg":{"name":"Periódicos","msg":{"name":"Artigo completo publicado em periódico","msg":null,"val":{"input":[{"val":"10.1016/j.infsof.2016.04.003","index":0},{"val":"Formal mutation testing for Circus","index":1},{"val":"2016","index":2},{"val":"S","index":4},{"val":"N","index":5},{"val":"S","index":6},{"val":"N","index":7},{"val":"INFORMATION AND SOFTWARE TECHNOLOGY","index":8},{"val":"1,5690","index":9},{"val":"0950-5849","index":10},{"val":"1","index":11},{"val":"100","index":13},{"val":"1º","index":15},{"val":"2º","index":16},{"val":"3º","index":17},{"val":"4º","index":18},{"val":"Digite, selecione ou inclua uma nova palavra-chave","index":19},{"val":"Digite, selecione ou inclua uma nova área de conhecimento","index":20},{"val":"Digite ou selecione um setor","index":21}],"textarea":[],"autores":[{"index":0,"val":["ALBERTO, ALEX (ALBERTO, ALEX)","CAVALCANTI, ANA (CAVALCANTI, ANA)","GAUDEL, MARIE-CLAUDE (GAUDEL, MARIE-CLAUDE)","SIMÃO, ADENILSO (SIMÃO, ADENILSO)"]}]}},"val":{"input":[{"val":"1234-5675","index":0},{"val":"http://dx.doi.org/10.1016/j.infsof.2016.04.003","index":1},{"val":"1","index":2},{"val":"2","index":3},{"val":"3","index":4}]}},"val":{"input":[{"val":"http://dx.doi.org/10.1016/j.infsof.2016.04.003","index":0}]}}'));

        autoLattes.File.read(function (data) {
            // leio ele como json
            try {
                var jsonData = JSON.parse(data);
                cb(jsonData);
            }
            catch(e) {
                console.log('Não foi possível ler o arquivo.');
                throw e;
            } 
        });
    },
};


// fim
});
