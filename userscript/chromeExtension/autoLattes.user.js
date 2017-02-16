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
    debugMsg: true,

    // aciona o debugger que está dentro da debug
    debug_is_debugger: false,
};

example = {
    lattesUrl: 'http://buscatextual.cnpq.br/buscatextual/visualizacv.do?id=K4767859T8',
    doi: 'http://dx.doi.org/10.1016/j.infsof.2016.04.003',
    ISSN: '1234-5675',
}

autoLattes = {

    // mensagem padrão
    msg: {},

    resetMsg: function () {
        debug('autoLattes.resetMsg()');
        // mensagem original
        autoLattes.msg = {};
        autoLattes.srcMsg = autoLattes.msg;
    },

    saveMsg: function () {
        // como salvar a msg
        debug('Mensagem salva: ', autoLattes.srcMsg);

        // adicionando a msg ao menu
        var msg = autoLattes.srcMsg;
    },

};






/******************************************************
 * autoLattes
 ******************************************************/
var documentReady = function() {

    autoLattes.resetMsg();


    // objeto autoLattes
    autoLattes.div = $('<div id="autoLattes">').appendTo($('.cont').first());
    // vamos adicionar agr o CSS
    autoLattes.div.css({
        position: 'absolute',
        right: '10px',
        top: '10px',
        background: '#FFF',
        width: '100px',
        minHeight: '100px',
    });




    // callback do modal de edição
    var onModal = function (e, name, $) {
        j = $;
        debug('onModal', this);

        // devo informar o resetMsg para o botão adicionar
        $('.adicionar').click(function(e) {
            autoLattes.resetMsg();
        });



        // msg atual que estamos trabalhando, para n ter q ficar digitando "autoLattes."
        var msg = autoLattes.msg;
        var self = this;
        // função find dentro do modal
        var find = function() { return $(self).is('iframe') ? $.apply(self, arguments) : $(self).find.apply($(self), arguments); };


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


        if($('.botao.salvar:not(.autoLattes):visible').length) {
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
                    msg.val = {};

                    // vamos começar com os inputs e textarea
                    ['input', 'textarea'].forEach(function (sel) {
                        var elems = find(sel).filter(':visible');

                        if(!elems.length) {
                            // dou um continue
                            return true;
                        }

                        // mensagem seguindo a lógica do relatorio
                        msg['val'][sel] = [];

                        elems.each(function(index, el) {
                            if(!$(el).val()) {
                                // está vazia
                                // continue
                                return true;
                            }

                            // para cada elem, eu adiciono na msg
                            msg['val'][sel].push({
                                val: $(el).val(),
                                index: index,
                            });
                        });
                    });


                    // obtendo a lista de autores
                    // autores em suggest
                    var msgAutores = [];
                    $('.grid-wrapper').each(function(index, grid) {
                        var tr = $(grid).find('.grid-content tr').slice(0, -1);

                        var autores = [];

                        tr.each(function(index, tr) {
                            // vamos pegar o td
                            var td = $(tr).find('td:eq(1)');
                            var autor = td.text();
                            autores.push(autor);
                        });

                        // autores preenchidos
                        if(autores.length) {
                            // se houver autores
                            msgAutores.push({
                                index: index,
                                val: autores,
                            });
                        }
                    });

                    if(msgAutores.length) {
                        msg['val']['autores'] = msgAutores;
                    }

                    console.log("msg['val']:", msg['val']);
                })
                .bind('click', function(e) {
                    // o que acontece dps
                    // do click
                    // para entender a próxima página

                    debugMsg('Botão SALVAR clicado, depois de mudar.');

                    // a última div, tem barra de navegação do lado
                    lastDiv = $('.areaSelecao').length >= 1;
                    if(!lastDiv) {
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
                        autoLattes.saveMsg();
                    }

                    // nesse momento
                    // devo ir para a próxima mensagem
                    autoLattes.msg = msg['msg'];
                })
                // para sabermos que já processei esse botão
                .addClass('autoLattes');
                // fim do botão de salvar


        } // fim se houver botão salvar


        // aqui eu detecto sempre q for inserido um pesquisador
        // no campo de sugestão
        // suggest-wrapper
        if($(this).is('iframe')) {

            var doc = $(this).document();            

            $(doc).on('edit', 'body', function(e) {

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

            });

        }

        // fim da onmdal
        // se eu quiser testar algo, devo usar esse jQuery
        test.$ = $;

        // volto o $ ao original
        window.$ = jQuery;


        // após terminar todos os passos da função modal
        // devo chamar a próxima função de test
        test.cb();

    } // onModal




    // agora eu tenho q implementar quando chamar essa função
    $.onLoad('iframe[src]:visible', function (e) {
        // nome pela div superior
        var name;
        try {
            name = $.trim($('.modal:visible .superior_central').clone().contents().eq(0).text());
        } catch(e) {
            name = '';
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

        }($(e.target).jQuery()))

        
        onModal.call(e.target, e, name, $(e.target).jQuery());
    });



    // quando eu devo resetar a msg
    // por exemplo: Produção > Artigos completos publicados em periódicos
    // 
    // toda vez que clico num menu que está na barra de navegação, em cima
    // nos links a direita inferior
    $('.menucent li a, #list_example a').click(function(e) {
        autoLattes.resetMsg();
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
                
                var result = this.data('events')[event];
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
                    $.document = $(this)[0].contentWindow.document;
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

    testNewProdBibliografica();
}

// é o jQuery atual do test
test.$ = $;

// clica nos menus de cima
test.menuClick = function (name, cb) {
    test.setNextCb(cb);

    $('a').filter(function(index) {
        return $(this).text() == name;
    }).click();
}

test.adicionar = function (cb) {
    test.setNextCb(cb);

    var $ = test.$;
    $('.adicionar:visible').click();
    return test;
}


// o próximo callback dos tests
test.nextCb = null;
test.setNextCb = function (cb) {
    if(cb) {
        test.nextCb = cb;
    }
    else {
        test.nextCb = null;
    }
}

// quando eu chamo o callback
test.cb = function () {
    var cb = test.nextCb;
    test.nextCb = null;

    var $ = test.$;

    if(cb) {
        cb.apply(this, arguments);
    }
}


test.val = function (index, text) {
    var $ = test.$;

    var elems = $('input:visible');
    var elem = null;

    // obtendo o elemento no meio de todos elems
    if(typeof index === "number") {
        elem = elems.eq(index);
    }
    else {
        elems.each(function() {
            if($(this).parent().text().trim() == index) {
                elem = $(this);
                return false;
            }
        });
        if(elem === null) {
            throw Error('Input "'+index+'" não encontrado.');
        }
    }

    if(text === undefined) {
        return elem;
    }

    elem.val(text);
    return elem;
}


test.confirm = function (cb) {
    var $ = test.$;

    test.setNextCb(cb);
    var btn = $('.botao.salvar:visible');
    if(btn.text() == 'Confirmar') {
        btn.click();
    }
    else {
        btn.find('a').click();
    }
    return test;
}


test.after = function () {
    test.setNextCb.apply(this, arguments);
    return test;
}

test.getDocument = function () {
    var $ = test.$;
    return $($.document);
}

/*test.ajax = function (fnBefore, fnCb, time) {
    time = time !== undefined ? time : 500;
    var self = this;
    test.getDocument().one('ajaxComplete', function (e, xhr, settings) {
        var args = arguments;
        debugger;
        test.val('Volume', '1');
        // setTimeout(function() {fnCb.apply(self, args);}, time);
    });
    fnBefore.apply(self);
}*/


test.sleep = function (interval, fn) {
    setTimeout(fn, interval);
    return test;
}

var testNewProdBibliografica = function () {
    test.menuClick('Artigos completos publicados em periódicos', function () {
        test.adicionar(function () {
            test.val(0, example.doi);
            test.confirm(function () {
                test.val(0, example.ISSN);
                test.val(2, 1);
                test.val(3, 2);
                test.val(4, 3);
                test.confirm().after(function () {
                    test.val(0, '10.1016/j.infsof.2016.04.003')[0].onblur();
                    test.sleep(500, function () {
                        test.val('Volume', '1');
                        test.val('Página inicial/ Número artigo eletrônico', '100');
                        test.sleep(1000, function () {
                            test.confirm();
                        });
                    });
                });
            });
        });
    });
}




if(TEST.enabled) {
    test();
}



// posso acessar o test de fora
window.test = test;

// fim
});