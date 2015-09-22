/**
 * Created by magdalena on 06.07.15.
 */
//(function(){})() --> diese Schreibweise macht eine Funktion in JS "self-invoking"
(function() {
    var app = angular.module('report', []);
    app.controller('ReportController', ['$anchorScroll', '$location', function($anchorScroll, $location){
        this.date = date;
        this.logo = logo;

        //Inititalize Tab 1
        this.tab = 1;

        //Selected Line in the Errorpath
        this.selected_ErrLine = null;

        //Available Functions (CFA-Graphs)
        this.functions = functions;

        //Help-Button-Content
        this.help_errorpath = help_errorpath;
        this.help_externalFiles = help_externalFiles;

        //Selected CFA-Graph
        if (functions.indexOf("main" != -1)) {
            this.selectedCFAFunction = functions.indexOf("main");
        } else {
            this.selectedCFAFunction = 0;
        }

        this.zoomFactor = 100;

        //preprocess Errorpath-Data for left content
        this.errorPathData = [];

        this.getValues = function(val){
            var values = {};
            if(val != "") {
                var singleStatements = val.split("\n");
                for (var i = 0; i < singleStatements.length-1; i++) {
                    values[singleStatements[i].split("==")[0].trim()] = singleStatements[i].split("==")[1].trim().slice(0,-1);
                }
            }
            return values;
        };

        for(var a = 0; a<errorPathData.length; a++) {
            var errPathElem = errorPathData[a];
            if (errPathElem.desc.substring(0, "Return edge from".length) != "Return edge from" && errPathElem.desc != "Function start dummy edge" && errPathElem.desc != "") {
                if (errPathElem.source in fCallEdges) {
                    errPathElem.target = fCallEdges[errPathElem.source][0];
                }
                var newValues = this.getValues(errPathElem.val);
                errPathElem["valDict"] = {};
                errPathElem["valString"] = "";
                if (a > 0) {
                    for (key in this.errorPathData[this.errorPathData.length - 1].valDict) {
                        errPathElem.valDict[key] = this.errorPathData[this.errorPathData.length - 1].valDict[key];
                    }
                }
                if (newValues != {}) {
                    for (key in newValues) {
                        errPathElem.valDict[key] = newValues[key];
                    }
                }
                // if I do it in one of the for-loops before I get the new values doubled
                for (key in errPathElem.valDict){
                    errPathElem.valString = errPathElem.valString + key + ":  " + errPathElem.valDict[key] + "\n";
                }
                this.errorPathData.push(errPathElem);
            }
        }


        //Behaviour for Click-Elements in Errorpath
        this.clickedErrpathElement = function($event){
            var y = $event.currentTarget.parentElement.id;
            this.setLine(y);
            this.markSource(this.errorPathData[y.substring("errpath-".length)].line);
            this.markCFAedge(y.substring("errpath-".length));
            this.markARGnode(y.substring("errpath-".length));
        };

        this.clickedErrpathButton = function($event){
            var button = $event.currentTarget.innerHTML;
            var line;
            if (button == "Prev" && (this.selected_ErrLine.substring("errpath-".length) == 0 || this.selected_ErrLine == null)) {

            } else if (button == "Prev") {
                line = parseInt(this.selected_ErrLine.substring("errpath-".length)) - 1;
                this.setLine("errpath-" + line);
                this.markSource(this.errorPathData[line].line);
                this.markCFAedge(line);
                this.markARGnode(line);
            } else if (button == "Start") {
                this.setLine("errpath-" + 0);
                this.markSource(this.errorPathData[0].line);
                this.markCFAedge(0);
                this.markARGnode(0);
            } else if (button == "Next" && (this.selected_ErrLine.substring("errpath-".length) == this.errorPathData.length -1)) {

            } else if (button == "Next") {
                line = parseInt(this.selected_ErrLine.substring("errpath-".length)) + 1;
                this.setLine("errpath-" + line);
                this.markSource(this.errorPathData[line].line);
                this.markCFAedge(line);
                this.markARGnode(line);
            }
        };

        //gets called when element with source-node-number in Errorpath is clicked
        this.showValues = function($event){
            var element = $event.currentTarget;
            if (element.classList.contains("markedTableElement")) {
                element.classList.remove("markedTableElement");
            } else {
                element.classList.add("markedTableElement");
            }
        };

        this.numOfValueMatches = 0;
        this.numOfDescriptionMatches = 0;
        this.searchFor = function(){
            this.numOfValueMatches = 0;
            this.numOfDescriptionMatches = 0;
            var allMarkedValueElements = document.getElementsByClassName("markedValueElement");
            //window.alert(allMarkedValueElements.length);
            while(allMarkedValueElements.length != 0){
                allMarkedValueElements[0].classList.remove("markedValueElement");
            }
            var allMarkedDescElements = document.getElementsByClassName("markedDescElement");
            //window.alert(allMarkedDescElements.length);
            while(allMarkedDescElements.length != 0){
                allMarkedDescElements[0].classList.remove("markedDescElement");
            }
            var allMarkedValueDescElements = document.getElementsByClassName("markedValueDescElement");
            //window.alert(allMarkedValueDescElements.length);
            while(allMarkedValueDescElements.length != 0){
                allMarkedValueDescElements[0].classList.remove("markedValueDescElement");
            }
            var searchedString = document.getElementsByClassName("search-input")[0].value;
            if(searchedString.trim() != "") {
                for (var l = 0; l < this.errorPathData.length; l++) {
                    var errorPathElem = this.errorPathData[l];
                    if (errorPathElem.val.contains(searchedString) && errorPathElem.desc.contains(searchedString)) {
                        this.numOfValueMatches = this.numOfValueMatches + 1;
                        this.numOfDescriptionMatches = this.numOfDescriptionMatches + 1;
                        document.getElementById("errpath-" + l).getElementsByTagName("td")[1].classList.add("markedValueDescElement");
                    }
                    else if (errorPathElem.val.contains(searchedString)) {
                        this.numOfValueMatches = this.numOfValueMatches + 1;
                        document.getElementById("errpath-" + l).getElementsByTagName("td")[1].classList.add("markedValueElement");
                    }
                    else if (errorPathElem.desc.contains(searchedString)) {
                        this.numOfDescriptionMatches = this.numOfDescriptionMatches + 1;
                        document.getElementById("errpath-" + l).getElementsByTagName("td")[1].classList.add("markedDescElement");
                    }
                }
            }
        };

        //Behaviour for Click-Elements in CFA
        this.clickedCFAElement = function($event){
            var y = $event.currentTarget.id;
            if (document.getElementById(y).classList.contains("edge")){
                this.setTab(3);
                var line;
                var source;
                if (y.split("->")[1] > 100000 || y.split("->")[0].substring("cfa-".length) > 100000){
                    source = y.split("->")[0].substring("cfa-".length);
                    line = cfaInfo["edges"][source + "->" + fCallEdges[source][1]]["line"];
                } else if (y.split("->")[0].substring("cfa-".length) in combinedNodes){
                    var textfields = document.getElementById("cfa-" + y.split("->")[0].substring("cfa-".length)).getElementsByTagName("text");
                    source = textfields[textfields.length - 2].innerHTML;
                    line = cfaInfo["edges"][source + "->" + y.split("->")[1]]["line"];
                } else {
                    line = cfaInfo["edges"][y.substring("cfa-".length)]["line"];
                }
                this.markSource(line);
            } else if (document.getElementById(y).classList.contains("node") && (y.substring("cfa-".length) > 100000)) {
                var func = document.getElementById(y).getElementsByTagName("text")[0].innerHTML;
                this.setCFAFunction(functions.indexOf(func));
            }
        };


        //Behaviour for Click-Elements in ARG
        this.clickedARGElement = function($event){
            var y = $event.currentTarget.id;
            if (document.getElementById(y).classList.contains("edge")){
                this.setTab(3);
                var line = document.getElementById(y).getElementsByTagName("text")[0].innerHTML.split(":")[0].substring("Line ".length);
                this.markSource(line);
            } else if (document.getElementById(y).classList.contains("node")){
                var cfaNodeNumber = document.getElementById(y).getElementsByTagName("text")[0].innerHTML.split("N")[1];
                this.setTab(1);
                this.markCFANode(cfaNodeNumber);
            }
        };


        //mark correct line in the Source-Tab
        this.lineMarked = false;
        this.markSource = function(line){
            if (this.lineMarked) {
                document.getElementsByClassName("markedSourceLine")[0].className = "prettyprint";
            }
            document.getElementById("source-" + line).getElementsByTagName("pre")[1].className = "markedSourceLine";
            $location.hash("source-" + line);
            this.lineMarked = true;
        };

        //mark correct CFA-edge
        this.cfaEdgeMarked = false;
        this.markCFAedge = function(index){
            var source = this.errorPathData[index].source;
            var target = this.errorPathData[index].target;
            var funcIndex = this.functions.indexOf(cfaInfo["nodes"][source]["func"]);
            /*var funcChanged = false;
             if (!(this.cfaFunctionIsSet(funcIndex))){
             funcChanged = true;
             }*/
            if(funcIndex != this.selectedCFAFunction) {
                this.setCFAFunction(funcIndex);
            }
            if(!(source in combinedNodes && target in combinedNodes)) {
                if(source in combinedNodes){
                    source = combinedNodes[source];
                }
                if (this.cfaEdgeMarked) {
                    document.getElementsByClassName("markedCFAEdge")[0].classList.remove("markedCFAEdge");
                }
                if (this.cfaNodeMarked) {
                    document.getElementsByClassName("markedCFANode")[0].classList.remove("markedCFANode");
                    this.cfaNodeMarked = false;
                }
                document.getElementById("cfa-" + source + "->" + target).classList.add("markedCFAEdge");
                this.scrollToCFAElement("cfa-" + source + "->" + target);
                this.cfaEdgeMarked = true;
            } else {
                this.markCFANode(combinedNodes[source]);
            }
        };
        //mark correct CFA-node
        this.cfaNodeMarked = false;
        this.markCFANode = function(nodenumber){
            if(this.cfaNodeMarked){
                document.getElementsByClassName("markedCFANode")[0].classList.remove("markedCFANode");
            }
            if(this.cfaEdgeMarked){
                document.getElementsByClassName("markedCFAEdge")[0].classList.remove("markedCFAEdge");
                this.cfaEdgeMarked = false;
            }
            this.setCFAFunction(this.functions.indexOf(cfaInfo["nodes"][nodenumber]["func"]));
            if(!(nodenumber in combinedNodes)) {
                document.getElementById("cfa-" + nodenumber).classList.add("markedCFANode");
                this.scrollToCFAElement("cfa-" + nodenumber);
            } else {
                document.getElementById("cfa-" + combinedNodes[nodenumber]).classList.add("markedCFANode");
                this.scrollToCFAElement("cfa-" + combinedNodes[nodenumber]);
            }
            this.cfaNodeMarked = true;
        };
        //scroll to correct CFA-element
        this.scrollToCFAElement = function(id){
            var element = document.getElementById(id);
            var box = document.getElementsByClassName("cfaContent")[0].parentNode.getBoundingClientRect();
            /* FUNKTIONIERT auch nicht, weil es nachm cfa-function-wechseln nicht in Kraft tritt FALSCH: Tritt in Kraft, aber ClientRect von unsichtbar ist 0 (s.u.)
             if (funcChanged) {
             xScroll = 0;
             yScroll = 0;
             }*/
            //PROBLEM: Koordinaten des Elements sind 0,wenn es nicht sichtbar ist
            var bcr = element.getBoundingClientRect();
            document.getElementsByClassName("cfaContent")[0].parentNode.scrollLeft = bcr.left - box.left - 10;
            document.getElementsByClassName("cfaContent")[0].parentNode.scrollTop = bcr.top - box.top - 50;
        };

        //mark correct ARG-node
        this.argNodeMarked = false;
        this.markARGnode = function(index){
            var argElement = this.errorPathData[index].argelem;
            if(this.argNodeMarked){
                document.getElementsByClassName("markedARGNode")[0].classList.remove("markedARGNode");
            }
            document.getElementById("arg-" + argElement).classList.add("markedARGNode");
            this.argNodeMarked = true;
            this.scrollToARGElement("arg-" + argElement);
        };
        // scroll to correct ARG-node
        this.scrollToARGElement = function(id){
            var element = document.getElementById(id);
            var box = document.getElementsByClassName("argContent")[0].parentNode.getBoundingClientRect();
            var xScroll = document.getElementsByClassName("argContent")[0].parentNode.scrollLeft;
            var yScroll = document.getElementsByClassName("argContent")[0].parentNode.scrollTop;
            var bcr = element.getBoundingClientRect();
            document.getElementsByClassName("argContent")[0].parentNode.scrollLeft = bcr.left + xScroll - box.left - 10;
            document.getElementsByClassName("argContent")[0].parentNode.scrollTop =  bcr.top + yScroll - box.top - 50;
        };


        //CFA-Controller
        this.setCFAFunction = function(value){
            document.getElementsByClassName("cfaContent")[0].parentNode.scrollTop = 0;
            document.getElementsByClassName("cfaContent")[0].parentNode.scrollLeft = 0;
            this.clearZoom();
            this.selectedCFAFunction = value;
        };
        this.cfaFunctionIsSet = function(value){
            return value === this.selectedCFAFunction;
        };


        //Sections-Controller
        this.setWidth = function(event) {
            if (mouseDown) {
                wholeWidth = document.getElementById("externalFiles_section").offsetWidth + document.getElementById("errorpath_section").offsetWidth;
                document.getElementById("errorpath_section").style.width = (Math.round(event.clientX/wholeWidth*100) + "%");
                document.getElementById("externalFiles_section").style.width = (Math.round((wholeWidth - event.clientX)/wholeWidth*100) + "%");
            }
        };
        this.setMouseUp = function(){
            mouseDown = false;
            document.onselectstart = null;
            document.onmousedown = null;
        };


        //Tab-Controller
        this.setTab = function(value){
            this.tab = value;
        };
        this.tabIsSet = function(value){
            $anchorScroll();
            return this.tab === value;
        };


        //Code-Controller
        this.setMouseDown = function(){
            mouseDown = true;
            //werden benötigt, damit kein Text markiert wird beim Verschieben der middleline (übernommen aus altem)
            document.onselectstart = function(){return false;};
            document.onmousedown = function(){return false;};
        };

        this.setLine = function(id){
            if (this.selected_ErrLine != null) {
                document.getElementById(this.selected_ErrLine).style.outline = "none";
            }
            document.getElementById(id).style.outline = "red solid 1px";
            this.selected_ErrLine = id;
        };

        this.setZoom = function(id){
            if (id.contains("cfa")) {
                document.getElementById("cfaGraph-" + this.selectedCFAFunction).transform.baseVal.getItem(0).setScale(this.zoomFactor / 100, this.zoomFactor / 100);
            } else if (id.contains("arg")){
                
                document.getElementById("argGraph-" + this.functions.length).transform.baseVal.getItem(0).setScale(this.zoomFactor / 100, this.zoomFactor / 100);
            }
        };
        this.clearZoom = function(){
            this.zoomFactor = 100;
            document.getElementById("cfaGraph-" + this.selectedCFAFunction).transform.baseVal.getItem(0).setScale(this.zoomFactor/100, this.zoomFactor/100);
        }
    }]);
})();

var date = Date.now();
var logo = "http://cpachecker.sosy-lab.org/logo.svg";
var wholeWidth;
var mouseDown = false;
var functions = ["__list_add", "__list_del", "fail", "gl_destroy", "gl_insert", "gl_read", "gl_sort", "gl_sort_pass", "inspect", "list_add", "list_move", "main", "val_from_node"];
var fCallEdges = {"136":[100023,138],"276":[100015,278],"350":[100011,352],"678":[100003,679],"556":[100002,557],"198":[100019,200],"405":[100008,407],"696":[100030,697],"697":[100031,698],"694":[100029,695],"386":[100009,388],"332":[100012,334],"693":[100028,694],"215":[100018,217],"691":[100027,692],"151":[100022,153],"653":[100004,657],"168":[100021,170],"235":[100017,237],"446":[100007,448],"527":[100001,528],"496":[100025,497],"317":[100013,319],"497":[100026,498],"255":[100016,257],"666":[100006,667],"296":[100014,298],"366":[100010,368],"183":[100020,185],"658":[100005,659],"483":[100024,484]};
var cfaInfo = {"edges":{"215->217":{"source":215,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":217,"line":268,"type":"CallToReturnEdge"},"413->416":{"source":413,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_16_continue","target":416,"line":508,"type":"MultiEdge"},"424->428":{"source":424,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_16_break","target":428,"line":518,"type":"BlankEdge"},"316->321":{"source":316,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_10_break","target":321,"line":393,"type":"BlankEdge"},"563->547":{"source":563,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_19_break return;","target":547,"line":681,"type":"MultiEdge"},"280->282":{"source":280,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_8_break while","target":282,"line":346,"type":"MultiEdge"},"612->610":{"source":612,"file":"..\/Schreibtisch\/example.c","stmt":"struct node *entry; struct node *__cil_tmp3; unsigned int __cil_tmp4; unsigned int __cil_tmp5; struct list_head *__cil_tmp6; unsigned long __cil_tmp7; char *__cil_tmp8; char *__cil_tmp9; __cil_tmp3 = (struct node *)0; __cil_tmp4 = (unsigned int)__cil_tmp3; __cil_tmp5 = __cil_tmp4 + 4; __cil_tmp6 = (struct list_head *)__cil_tmp5; __cil_tmp7 = (unsigned long)__cil_tmp6; __cil_tmp8 = (char *)head; __cil_tmp9 = __cil_tmp8 - __cil_tmp7; entry = (struct node *)__cil_tmp9; return *((int *)entry);","target":610,"line":736,"type":"MultiEdge"},"488->496":{"source":488,"file":"..\/Schreibtisch\/example.c","stmt":"unsigned int __cil_tmp3; unsigned int __cil_tmp4; struct list_head *__cil_tmp5; struct list_head *__cil_tmp6; __cil_tmp3 = (unsigned int)list; __cil_tmp4 = __cil_tmp3 + 4; __cil_tmp5 = *((struct list_head **)__cil_tmp4); __cil_tmp6 = *((struct list_head **)list);","target":496,"line":594,"type":"MultiEdge"},"660->662":{"source":660,"file":"..\/Schreibtisch\/example.c","stmt":"[val0 <= val1]","target":662,"line":789,"type":"AssumeEdge"},"9->131":{"source":9,"file":"..\/Schreibtisch\/example.c","stmt":"const struct node *node; unsigned int __cil_tmp3; struct list_head *__cil_tmp4; unsigned int __cil_tmp5; int __cil_tmp6; unsigned int __cil_tmp7; unsigned int __cil_tmp8; unsigned int __cil_tmp9; struct list_head *__cil_tmp10; unsigned int __cil_tmp11; int __cil_tmp12; unsigned int __cil_tmp13; unsigned int __cil_tmp14; struct list_head *__cil_tmp15; unsigned int __cil_tmp16; struct list_head *__cil_tmp17; unsigned int __cil_tmp18; int __cil_tmp19; unsigned int __cil_tmp20; unsigned int __cil_tmp21; unsigned int __cil_tmp22; struct list_head *__cil_tmp23; unsigned int __cil_tmp24; int __cil_tmp25; struct node *__cil_tmp26; unsigned int __cil_tmp27; unsigned int __cil_tmp28; struct list_head *__cil_tmp29; unsigned long __cil_tmp30; char *__cil_tmp31; char *__cil_tmp32; struct node *__cil_tmp33; unsigned int __cil_tmp34; unsigned int __cil_tmp35; const struct list_head *__cil_tmp36; unsigned int __cil_tmp37; unsigned int __cil_tmp38; unsigned int __cil_tmp39; struct list_head *__cil_tmp40; unsigned int __cil_tmp41; int __cil_tmp42; unsigned int __cil_tmp43; unsigned int __cil_tmp44; const struct list_head *__cil_tmp45; unsigned int __cil_tmp46; unsigned int __cil_tmp47; unsigned int __cil_tmp48; unsigned int __cil_tmp49; struct list_head *__cil_tmp50; unsigned int __cil_tmp51; int __cil_tmp52; unsigned int __cil_tmp53; unsigned int __cil_tmp54; const struct list_head *__cil_tmp55; unsigned int __cil_tmp56; unsigned int __cil_tmp57; unsigned int __cil_tmp58; struct list_head *__cil_tmp59; unsigned int __cil_tmp60; int __cil_tmp61; unsigned int __cil_tmp62; unsigned int __cil_tmp63; const struct list_head *__cil_tmp64; unsigned int __cil_tmp65; unsigned int __cil_tmp66; unsigned int __cil_tmp67; unsigned int __cil_tmp68; struct list_head *__cil_tmp69; unsigned int __cil_tmp70; int __cil_tmp71; const struct node *__cil_tmp72; unsigned int __cil_tmp73; unsigned int __cil_tmp74; int __cil_tmp75; unsigned int __cil_tmp76; unsigned int __cil_tmp77; const struct list_head *__cil_tmp78; const struct node *__cil_tmp79; unsigned int __cil_tmp80; unsigned int __cil_tmp81; int __cil_tmp82; const int *__cil_tmp83; const struct node *__cil_tmp84; unsigned int __cil_tmp85; unsigned int __cil_tmp86; int __cil_tmp87; unsigned int __cil_tmp88; unsigned int __cil_tmp89; struct list_head *__cil_tmp90; unsigned int __cil_tmp91; unsigned int __cil_tmp92; struct list_head *__cil_tmp93; unsigned int __cil_tmp94; unsigned int __cil_tmp95; int __cil_tmp96; unsigned int __cil_tmp97; unsigned int __cil_tmp98; unsigned int __cil_tmp99; struct list_head *__cil_tmp100; struct list_head *__cil_tmp101; unsigned int __cil_tmp102; unsigned int __cil_tmp103; int __cil_tmp104; struct list_head *__cil_tmp105; unsigned int __cil_tmp106; unsigned int __cil_tmp107; unsigned int __cil_tmp108; const struct list_head *__cil_tmp109; unsigned int __cil_tmp110; struct list_head *__cil_tmp111; unsigned int __cil_tmp112; struct node *__cil_tmp113; unsigned int __cil_tmp114; unsigned int __cil_tmp115; struct list_head *__cil_tmp116; unsigned long __cil_tmp117; char *__cil_tmp118; char *__cil_tmp119; struct node *__cil_tmp120; unsigned int __cil_tmp121; int __cil_tmp122; while","target":131,"line":44,"type":"MultiEdge"},"409->413":{"source":409,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_15_break __cil_tmp105 = *((const struct list_head **)head); head = (const struct list_head *)__cil_tmp105; while","target":413,"line":503,"type":"MultiEdge"},"660->663":{"source":660,"file":"..\/Schreibtisch\/example.c","stmt":"[!(val0 <= val1)]","target":663,"line":789,"type":"AssumeEdge"},"149->152":{"source":149,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp6 == 0)]","target":152,"line":188,"type":"AssumeEdge"},"149->151":{"source":149,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp6 == 0]","target":151,"line":188,"type":"AssumeEdge"},"544->500":{"source":544,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_18_break return;","target":500,"line":659,"type":"MultiEdge"},"150->155":{"source":150,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_1_break","target":155,"line":195,"type":"BlankEdge"},"593->607":{"source":593,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_20_break","target":607,"line":712,"type":"BlankEdge"},"341->348":{"source":341,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp76 = (unsigned int)node; __cil_tmp77 = __cil_tmp76 + 4; __cil_tmp78 = (const struct list_head *)__cil_tmp77; __cil_tmp79 = (const struct node *)__cil_tmp78; __cil_tmp80 = (unsigned int)__cil_tmp79; __cil_tmp81 = (unsigned int)node; __cil_tmp82 = __cil_tmp81 != __cil_tmp80;","target":348,"line":420,"type":"MultiEdge"},"667->646":{"source":667,"file":"<none>","stmt":"","target":646,"line":0,"type":"BlankEdge"},"666->667":{"source":666,"file":"..\/Schreibtisch\/example.c","stmt":"list_move(pos0, pos1);","target":667,"line":796,"type":"CallToReturnEdge"},"370->372":{"source":370,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_13_break while","target":372,"line":456,"type":"MultiEdge"},"552->555":{"source":552,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_19_continue","target":555,"line":669,"type":"MultiEdge"},"698->687":{"source":698,"file":"..\/Schreibtisch\/example.c","stmt":"return 0;","target":687,"line":836,"type":"ReturnStatementEdge"},"2->3":{"source":2,"file":"..\/Schreibtisch\/example.c","stmt":"Label: ERROR","target":3,"line":35,"type":"BlankEdge"},"502->517":{"source":502,"file":"..\/Schreibtisch\/example.c","stmt":"struct node *node; void *tmp; unsigned int __cil_tmp4; unsigned int __cil_tmp5; unsigned int __cil_tmp6; struct list_head *__cil_tmp7; unsigned int __cil_tmp8; unsigned int __cil_tmp9; unsigned int __cil_tmp10; unsigned int __cil_tmp11; unsigned int __cil_tmp12; unsigned int __cil_tmp13; unsigned int __cil_tmp14; unsigned int __cil_tmp15; __cil_tmp4 = 20U;","target":517,"line":611,"type":"MultiEdge"},"696->697":{"source":696,"file":"..\/Schreibtisch\/example.c","stmt":"inspect(__cil_tmp2);","target":697,"line":833,"type":"CallToReturnEdge"},"560->552":{"source":560,"file":"<none>","stmt":" ","target":552,"line":0,"type":"MultiEdge"},"444->447":{"source":444,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp122 == 0)]","target":447,"line":541,"type":"AssumeEdge"},"444->446":{"source":444,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp122 == 0]","target":446,"line":541,"type":"AssumeEdge"},"216->214":{"source":216,"file":"<none>","stmt":"","target":214,"line":0,"type":"BlankEdge"},"590->592":{"source":590,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp4 != __cil_tmp3]","target":592,"line":710,"type":"AssumeEdge"},"372->375":{"source":372,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_14_continue","target":375,"line":459,"type":"MultiEdge"},"450->7":{"source":450,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_17_break return;","target":7,"line":550,"type":"MultiEdge"},"590->593":{"source":590,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp4 != __cil_tmp3)]","target":593,"line":710,"type":"AssumeEdge"},"523->520":{"source":523,"file":"<none>","stmt":"","target":520,"line":0,"type":"BlankEdge"},"366->368":{"source":366,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":368,"line":449,"type":"CallToReturnEdge"},"351->349":{"source":351,"file":"<none>","stmt":"","target":349,"line":0,"type":"BlankEdge"},"259->261":{"source":259,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_7_break while","target":261,"line":321,"type":"MultiEdge"},"336->338":{"source":336,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_11_break while","target":338,"line":414,"type":"MultiEdge"},"498->486":{"source":498,"file":"..\/Schreibtisch\/example.c","stmt":"return;","target":486,"line":607,"type":"ReturnStatementEdge"},"282->285":{"source":282,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_9_continue","target":285,"line":349,"type":"MultiEdge"},"421->424":{"source":421,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp110 != __cil_tmp106)]","target":424,"line":516,"type":"AssumeEdge"},"244->253":{"source":244,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp34 = (unsigned int)node; __cil_tmp35 = __cil_tmp34 + 12; __cil_tmp36 = (const struct list_head *)__cil_tmp35; __cil_tmp37 = (unsigned int)__cil_tmp36; __cil_tmp38 = (unsigned int)node; __cil_tmp39 = __cil_tmp38 + 12; __cil_tmp40 = *((const struct list_head **)__cil_tmp39); __cil_tmp41 = (unsigned int)__cil_tmp40; __cil_tmp42 = __cil_tmp41 == __cil_tmp37;","target":253,"line":303,"type":"MultiEdge"},"350->352":{"source":350,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":352,"line":429,"type":"CallToReturnEdge"},"421->423":{"source":421,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp110 != __cil_tmp106]","target":423,"line":516,"type":"AssumeEdge"},"253->255":{"source":253,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp42 == 0]","target":255,"line":312,"type":"AssumeEdge"},"405->407":{"source":405,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":407,"line":496,"type":"CallToReturnEdge"},"253->256":{"source":253,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp42 == 0)]","target":256,"line":312,"type":"AssumeEdge"},"694->695":{"source":694,"file":"..\/Schreibtisch\/example.c","stmt":"gl_sort();","target":695,"line":831,"type":"CallToReturnEdge"},"480->481":{"source":480,"file":"<none>","stmt":"Function start dummy edge","target":481,"line":0,"type":"BlankEdge"},"169->167":{"source":169,"file":"<none>","stmt":"","target":167,"line":0,"type":"BlankEdge"},"556->557":{"source":556,"file":"..\/Schreibtisch\/example.c","stmt":"gl_insert(tmp);","target":557,"line":673,"type":"CallToReturnEdge"},"548->549":{"source":548,"file":"<none>","stmt":"Function start dummy edge","target":549,"line":0,"type":"BlankEdge"},"555->556":{"source":555,"file":"..\/Schreibtisch\/example.c","stmt":"tmp = __VERIFIER_nondet_int();","target":556,"line":672,"type":"StatementEdge"},"241->244":{"source":241,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_7_continue","target":244,"line":300,"type":"MultiEdge"},"692->693":{"source":692,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp1 = (const struct list_head *)(&gl_list);","target":693,"line":829,"type":"StatementEdge"},"695->696":{"source":695,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp2 = (const struct list_head *)(&gl_list);","target":696,"line":832,"type":"StatementEdge"},"354->356":{"source":354,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_12_break while","target":356,"line":436,"type":"MultiEdge"},"445->450":{"source":445,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_17_break","target":450,"line":548,"type":"BlankEdge"},"264->274":{"source":264,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp43 = (unsigned int)node; __cil_tmp44 = __cil_tmp43 + 12; __cil_tmp45 = (const struct list_head *)__cil_tmp44; __cil_tmp46 = (unsigned int)__cil_tmp45; __cil_tmp47 = 16; __cil_tmp48 = (unsigned int)node; __cil_tmp49 = __cil_tmp48 + __cil_tmp47; __cil_tmp50 = *((const struct list_head **)__cil_tmp49); __cil_tmp51 = (unsigned int)__cil_tmp50; __cil_tmp52 = __cil_tmp51 == __cil_tmp46;","target":274,"line":327,"type":"MultiEdge"},"496->497":{"source":496,"file":"..\/Schreibtisch\/example.c","stmt":"__list_del(__cil_tmp5, __cil_tmp6);","target":497,"line":604,"type":"CallToReturnEdge"},"198->200":{"source":198,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":200,"line":247,"type":"CallToReturnEdge"},"137->135":{"source":137,"file":"<none>","stmt":"","target":135,"line":0,"type":"BlankEdge"},"359->364":{"source":359,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp83 = (const int *)node; __cil_tmp84 = (const struct node *)__cil_tmp83; __cil_tmp85 = (unsigned int)__cil_tmp84; __cil_tmp86 = (unsigned int)node; __cil_tmp87 = __cil_tmp86 == __cil_tmp85;","target":364,"line":442,"type":"MultiEdge"},"684->671":{"source":684,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_22_break return;","target":671,"line":818,"type":"MultiEdge"},"679->681":{"source":679,"file":"..\/Schreibtisch\/example.c","stmt":"[!(tmp == 0)]","target":681,"line":813,"type":"AssumeEdge"},"297->295":{"source":297,"file":"<none>","stmt":"","target":295,"line":0,"type":"BlankEdge"},"679->682":{"source":679,"file":"..\/Schreibtisch\/example.c","stmt":"[tmp == 0]","target":682,"line":813,"type":"AssumeEdge"},"658->659":{"source":658,"file":"..\/Schreibtisch\/example.c","stmt":"tmp___0 = val_from_node(pos1);","target":659,"line":786,"type":"CallToReturnEdge"},"662->649":{"source":662,"file":"..\/Schreibtisch\/example.c","stmt":"pos0 = pos1; Goto: while_21_continue","target":649,"line":790,"type":"MultiEdge"},"653->657":{"source":653,"file":"..\/Schreibtisch\/example.c","stmt":"tmp = val_from_node(pos0);","target":657,"line":784,"type":"CallToReturnEdge"},"518->519":{"source":518,"file":"..\/Schreibtisch\/example.c","stmt":"node = (struct node *)tmp;","target":519,"line":629,"type":"StatementEdge"},"631->632":{"source":631,"file":"<none>","stmt":"Function start dummy edge","target":632,"line":0,"type":"BlankEdge"},"654->653":{"source":654,"file":"<none>","stmt":"","target":653,"line":0,"type":"BlankEdge"},"152->150":{"source":152,"file":"<none>","stmt":"","target":150,"line":0,"type":"BlankEdge"},"135->140":{"source":135,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_0_break","target":140,"line":176,"type":"BlankEdge"},"315->318":{"source":315,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp71 == 0)]","target":318,"line":386,"type":"AssumeEdge"},"315->317":{"source":315,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp71 == 0]","target":317,"line":386,"type":"AssumeEdge"},"197->202":{"source":197,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_4_break","target":202,"line":252,"type":"BlankEdge"},"236->234":{"source":236,"file":"<none>","stmt":"","target":234,"line":0,"type":"BlankEdge"},"239->241":{"source":239,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_6_break while","target":241,"line":297,"type":"MultiEdge"},"184->182":{"source":184,"file":"<none>","stmt":"","target":182,"line":0,"type":"BlankEdge"},"321->323":{"source":321,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_10_break while","target":323,"line":395,"type":"MultiEdge"},"3->4":{"source":3,"file":"..\/Schreibtisch\/example.c","stmt":"__VERIFIER_error();","target":4,"line":35,"type":"StatementEdge"},"182->187":{"source":182,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_3_break","target":187,"line":233,"type":"BlankEdge"},"416->421":{"source":416,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp106 = (unsigned int)head; __cil_tmp107 = (unsigned int)node; __cil_tmp108 = __cil_tmp107 + 4; __cil_tmp109 = (const struct list_head *)__cil_tmp108; __cil_tmp110 = (unsigned int)__cil_tmp109;","target":421,"line":511,"type":"MultiEdge"},"230->233":{"source":230,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_6_continue","target":233,"line":287,"type":"MultiEdge"},"295->300":{"source":295,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_9_break","target":300,"line":368,"type":"BlankEdge"},"204->207":{"source":204,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_5_continue","target":207,"line":257,"type":"MultiEdge"},"181->183":{"source":181,"file":"..\/Schreibtisch\/example.c","stmt":"[head == 0]","target":183,"line":227,"type":"AssumeEdge"},"181->184":{"source":181,"file":"..\/Schreibtisch\/example.c","stmt":"[!(head == 0)]","target":184,"line":227,"type":"AssumeEdge"},"5->3":{"source":5,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: ERROR","target":3,"line":36,"type":"BlankEdge"},"691->692":{"source":691,"file":"..\/Schreibtisch\/example.c","stmt":"gl_read();","target":692,"line":828,"type":"CallToReturnEdge"},"142->145":{"source":142,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_1_continue","target":145,"line":181,"type":"MultiEdge"},"678->679":{"source":678,"file":"..\/Schreibtisch\/example.c","stmt":"tmp = gl_sort_pass();","target":679,"line":811,"type":"CallToReturnEdge"},"8->9":{"source":8,"file":"<none>","stmt":"Function start dummy edge","target":9,"line":0,"type":"BlankEdge"},"207->213":{"source":207,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp20 = (unsigned int)head; __cil_tmp21 = (unsigned int)head; __cil_tmp22 = __cil_tmp21 + 4; __cil_tmp23 = *((const struct list_head **)__cil_tmp22); __cil_tmp24 = (unsigned int)__cil_tmp23; __cil_tmp25 = __cil_tmp24 != __cil_tmp20;","target":213,"line":260,"type":"MultiEdge"},"403->406":{"source":403,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp104 == 0)]","target":406,"line":494,"type":"AssumeEdge"},"403->405":{"source":403,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp104 == 0]","target":405,"line":494,"type":"AssumeEdge"},"583->586":{"source":583,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_20_continue","target":586,"line":703,"type":"MultiEdge"},"302->305":{"source":302,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_10_continue","target":305,"line":373,"type":"MultiEdge"},"567->568":{"source":567,"file":"<none>","stmt":"Function start dummy edge","target":568,"line":0,"type":"BlankEdge"},"668->630":{"source":668,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_21_break return any_change;","target":630,"line":799,"type":"MultiEdge"},"395->403":{"source":395,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp97 = 8; __cil_tmp98 = (unsigned int)node; __cil_tmp99 = __cil_tmp98 + __cil_tmp97; __cil_tmp100 = *((const struct list_head **)__cil_tmp99); __cil_tmp101 = *((struct list_head **)__cil_tmp100); __cil_tmp102 = (unsigned int)__cil_tmp101; __cil_tmp103 = (unsigned int)head; __cil_tmp104 = __cil_tmp103 == __cil_tmp102;","target":403,"line":486,"type":"MultiEdge"},"274->277":{"source":274,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp52 == 0)]","target":277,"line":337,"type":"AssumeEdge"},"274->276":{"source":274,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp52 == 0]","target":276,"line":337,"type":"AssumeEdge"},"387->385":{"source":387,"file":"<none>","stmt":"","target":385,"line":0,"type":"BlankEdge"},"682->684":{"source":682,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_22_break","target":684,"line":815,"type":"BlankEdge"},"294->297":{"source":294,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp61 == 0)]","target":297,"line":361,"type":"AssumeEdge"},"294->296":{"source":294,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp61 == 0]","target":296,"line":361,"type":"AssumeEdge"},"663->666":{"source":663,"file":"..\/Schreibtisch\/example.c","stmt":" any_change = 1;","target":666,"line":795,"type":"MultiEdge"},"529->532":{"source":529,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_18_continue","target":532,"line":645,"type":"MultiEdge"},"196->199":{"source":196,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp19 == 0)]","target":199,"line":245,"type":"AssumeEdge"},"196->198":{"source":196,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp19 == 0]","target":198,"line":245,"type":"AssumeEdge"},"484->479":{"source":484,"file":"..\/Schreibtisch\/example.c","stmt":"return;","target":479,"line":590,"type":"ReturnStatementEdge"},"532->544":{"source":532,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp8 = (unsigned int)node; __cil_tmp9 = __cil_tmp8 + 12; __cil_tmp10 = (unsigned int)node; __cil_tmp11 = __cil_tmp10 + 12; *((struct list_head **)__cil_tmp9) = (struct list_head *)__cil_tmp11; __cil_tmp12 = (unsigned int)node; __cil_tmp13 = __cil_tmp12 + 12; __cil_tmp14 = (unsigned int)node; __cil_tmp15 = __cil_tmp14 + 12; *((struct list_head **)__cil_tmp13) = (struct list_head *)__cil_tmp15; Goto: while_18_break","target":544,"line":647,"type":"MultiEdge"},"483->484":{"source":483,"file":"..\/Schreibtisch\/example.c","stmt":"__list_add(new, head, __cil_tmp3);","target":484,"line":588,"type":"CallToReturnEdge"},"681->675":{"source":681,"file":"<none>","stmt":" ","target":675,"line":0,"type":"MultiEdge"},"487->488":{"source":487,"file":"<none>","stmt":"Function start dummy edge","target":488,"line":0,"type":"BlankEdge"},"607->566":{"source":607,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_20_break return;","target":566,"line":730,"type":"MultiEdge"},"611->612":{"source":611,"file":"<none>","stmt":"Function start dummy edge","target":612,"line":0,"type":"BlankEdge"},"140->142":{"source":140,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_0_break while","target":142,"line":178,"type":"MultiEdge"},"326->330":{"source":326,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp72 = (const struct node *)head; __cil_tmp73 = (unsigned int)__cil_tmp72; __cil_tmp74 = (unsigned int)node; __cil_tmp75 = __cil_tmp74 != __cil_tmp73;","target":330,"line":401,"type":"MultiEdge"},"481->483":{"source":481,"file":"..\/Schreibtisch\/example.c","stmt":"struct list_head *__cil_tmp3; __cil_tmp3 = *((struct list_head **)head);","target":483,"line":584,"type":"MultiEdge"},"549->552":{"source":549,"file":"..\/Schreibtisch\/example.c","stmt":"int tmp; int tmp___0; while","target":552,"line":665,"type":"MultiEdge"},"285->294":{"source":285,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp53 = (unsigned int)node; __cil_tmp54 = __cil_tmp53 + 4; __cil_tmp55 = (const struct list_head *)__cil_tmp54; __cil_tmp56 = (unsigned int)__cil_tmp55; __cil_tmp57 = (unsigned int)node; __cil_tmp58 = __cil_tmp57 + 12; __cil_tmp59 = *((const struct list_head **)__cil_tmp58); __cil_tmp60 = (unsigned int)__cil_tmp59; __cil_tmp61 = __cil_tmp60 != __cil_tmp56;","target":294,"line":352,"type":"MultiEdge"},"528->529":{"source":528,"file":"..\/Schreibtisch\/example.c","stmt":"while","target":529,"line":645,"type":"BlankEdge"},"568->583":{"source":568,"file":"..\/Schreibtisch\/example.c","stmt":"struct list_head *next; struct list_head *__cil_tmp2; unsigned int __cil_tmp3; unsigned int __cil_tmp4; struct list_head *__cil_tmp5; struct node *__cil_tmp6; unsigned int __cil_tmp7; unsigned int __cil_tmp8; struct list_head *__cil_tmp9; unsigned long __cil_tmp10; char *__cil_tmp11; char *__cil_tmp12; struct node *__cil_tmp13; void *__cil_tmp14; while","target":583,"line":687,"type":"MultiEdge"},"1->2":{"source":1,"file":"<none>","stmt":"Function start dummy edge","target":2,"line":0,"type":"BlankEdge"},"349->354":{"source":349,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_12_break","target":354,"line":434,"type":"BlankEdge"},"375->384":{"source":375,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp88 = (unsigned int)node; __cil_tmp89 = __cil_tmp88 + 4; __cil_tmp90 = *((const struct list_head **)__cil_tmp89); __cil_tmp91 = (unsigned int)__cil_tmp90; __cil_tmp92 = __cil_tmp91 + 4; __cil_tmp93 = *((struct list_head **)__cil_tmp92); __cil_tmp94 = (unsigned int)__cil_tmp93; __cil_tmp95 = (unsigned int)head; __cil_tmp96 = __cil_tmp95 == __cil_tmp94;","target":384,"line":462,"type":"MultiEdge"},"277->275":{"source":277,"file":"<none>","stmt":"","target":275,"line":0,"type":"BlankEdge"},"300->302":{"source":300,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_9_break while","target":302,"line":370,"type":"MultiEdge"},"557->558":{"source":557,"file":"..\/Schreibtisch\/example.c","stmt":"tmp___0 = __VERIFIER_nondet_int();","target":558,"line":674,"type":"StatementEdge"},"497->498":{"source":497,"file":"..\/Schreibtisch\/example.c","stmt":"list_add(list, head);","target":498,"line":605,"type":"CallToReturnEdge"},"189->192":{"source":189,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_4_continue","target":192,"line":238,"type":"MultiEdge"},"234->239":{"source":234,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_6_break","target":239,"line":295,"type":"BlankEdge"},"428->430":{"source":428,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_16_break while","target":430,"line":524,"type":"MultiEdge"},"255->257":{"source":255,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":257,"line":314,"type":"CallToReturnEdge"},"688->700":{"source":688,"file":"<none>","stmt":"INIT GLOBAL VARS","target":700,"line":0,"type":"BlankEdge"},"219->230":{"source":219,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_5_break __cil_tmp26 = (struct node *)0; __cil_tmp27 = (unsigned int)__cil_tmp26; __cil_tmp28 = __cil_tmp27 + 4; __cil_tmp29 = (struct list_head *)__cil_tmp28; __cil_tmp30 = (unsigned long)__cil_tmp29; __cil_tmp31 = (char *)head; __cil_tmp32 = __cil_tmp31 - __cil_tmp30; __cil_tmp33 = (struct node *)__cil_tmp32; node = (const struct node *)__cil_tmp33; while","target":230,"line":275,"type":"MultiEdge"},"454->455":{"source":454,"file":"<none>","stmt":"Function start dummy edge","target":455,"line":0,"type":"BlankEdge"},"522->520":{"source":522,"file":"<none>","stmt":"","target":520,"line":0,"type":"BlankEdge"},"131->134":{"source":131,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_0_continue","target":134,"line":168,"type":"MultiEdge"},"675->678":{"source":675,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_22_continue","target":678,"line":808,"type":"MultiEdge"},"213->216":{"source":213,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp25 == 0)]","target":216,"line":266,"type":"AssumeEdge"},"213->215":{"source":213,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp25 == 0]","target":215,"line":266,"type":"AssumeEdge"},"365->370":{"source":365,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_13_break","target":370,"line":454,"type":"BlankEdge"},"330->333":{"source":330,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp75 == 0)]","target":333,"line":405,"type":"AssumeEdge"},"183->185":{"source":183,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":185,"line":229,"type":"CallToReturnEdge"},"330->332":{"source":330,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp75 == 0]","target":332,"line":405,"type":"AssumeEdge"},"447->445":{"source":447,"file":"<none>","stmt":"","target":445,"line":0,"type":"BlankEdge"},"166->169":{"source":166,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp12 == 0)]","target":169,"line":209,"type":"AssumeEdge"},"471->469":{"source":471,"file":"..\/Schreibtisch\/example.c","stmt":"unsigned int __cil_tmp3; unsigned int __cil_tmp4; __cil_tmp3 = (unsigned int)next; __cil_tmp4 = __cil_tmp3 + 4; *((struct list_head **)__cil_tmp4) = prev; *((struct list_head **)prev) = next; return;","target":469,"line":573,"type":"MultiEdge"},"166->168":{"source":166,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp12 == 0]","target":168,"line":209,"type":"AssumeEdge"},"305->315":{"source":305,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp62 = (unsigned int)node; __cil_tmp63 = __cil_tmp62 + 4; __cil_tmp64 = (const struct list_head *)__cil_tmp63; __cil_tmp65 = (unsigned int)__cil_tmp64; __cil_tmp66 = 16; __cil_tmp67 = (unsigned int)node; __cil_tmp68 = __cil_tmp67 + __cil_tmp66; __cil_tmp69 = *((const struct list_head **)__cil_tmp68); __cil_tmp70 = (unsigned int)__cil_tmp69; __cil_tmp71 = __cil_tmp70 != __cil_tmp65;","target":315,"line":376,"type":"MultiEdge"},"700->691":{"source":700,"file":"..\/Schreibtisch\/example.c","stmt":"void __VERIFIER_error(); void __assert_fail(const char *__assertion, const char *__file, unsigned int __line, const char *__function); void __assert_perror_fail(int __errnum, const char *__file, unsigned int __line, const char *__function); void __assert(const char *__assertion, const char *__file, int __line); typedef unsigned int size_t; struct list_head { struct list_head *next; struct list_head *prev; }; struct node { int value; struct list_head linkage; struct list_head nested; }; void * malloc(size_t __size); void free(void *__ptr); void abort(); int __VERIFIER_nondet_int(); void fail(); struct list_head gl_list = { &gl_list, &gl_list }; void inspect(const struct list_head *head); void __list_add(struct list_head *new, struct list_head *prev, struct list_head *next); void __list_del(struct list_head *prev, struct list_head *next); void list_add(struct list_head *new, struct list_head *head); void list_move(struct list_head *list, struct list_head *head); void gl_insert(int value); void gl_read(); void gl_destroy(); int val_from_node(struct list_head *head); _Bool gl_sort_pass(); void gl_sort(); int main(); Function start dummy edge const struct list_head *__cil_tmp1; const struct list_head *__cil_tmp2;","target":691,"line":1,"type":"MultiEdge"},"256->254":{"source":256,"file":"<none>","stmt":"","target":254,"line":0,"type":"BlankEdge"},"655->668":{"source":655,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_21_break","target":668,"line":780,"type":"BlankEdge"},"527->528":{"source":527,"file":"..\/Schreibtisch\/example.c","stmt":"list_add(__cil_tmp7, &gl_list);","target":528,"line":642,"type":"CallToReturnEdge"},"470->471":{"source":470,"file":"<none>","stmt":"Function start dummy edge","target":471,"line":0,"type":"BlankEdge"},"423->413":{"source":423,"file":"..\/Schreibtisch\/example.c","stmt":" __cil_tmp111 = *((const struct list_head **)head); head = (const struct list_head *)__cil_tmp111; ","target":413,"line":521,"type":"MultiEdge"},"519->521":{"source":519,"file":"..\/Schreibtisch\/example.c","stmt":"[node == 0]","target":521,"line":631,"type":"AssumeEdge"},"519->522":{"source":519,"file":"..\/Schreibtisch\/example.c","stmt":"[!(node == 0)]","target":522,"line":631,"type":"AssumeEdge"},"657->658":{"source":657,"file":"..\/Schreibtisch\/example.c","stmt":"val0 = tmp;","target":658,"line":785,"type":"StatementEdge"},"649->652":{"source":649,"file":"..\/Schreibtisch\/example.c","stmt":"pos1 = *((struct list_head **)pos0); __cil_tmp9 = (unsigned int)pos1; __cil_tmp10 = (unsigned int)(&gl_list);","target":652,"line":774,"type":"MultiEdge"},"167->172":{"source":167,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_2_break","target":172,"line":216,"type":"BlankEdge"},"406->404":{"source":406,"file":"<none>","stmt":"","target":404,"line":0,"type":"BlankEdge"},"134->137":{"source":134,"file":"..\/Schreibtisch\/example.c","stmt":"[!(head == 0)]","target":137,"line":170,"type":"AssumeEdge"},"134->136":{"source":134,"file":"..\/Schreibtisch\/example.c","stmt":"[head == 0]","target":136,"line":170,"type":"AssumeEdge"},"261->264":{"source":261,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_8_continue","target":264,"line":324,"type":"MultiEdge"},"276->278":{"source":276,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":278,"line":339,"type":"CallToReturnEdge"},"659->660":{"source":659,"file":"..\/Schreibtisch\/example.c","stmt":"val1 = tmp___0;","target":660,"line":787,"type":"StatementEdge"},"151->153":{"source":151,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":153,"line":190,"type":"CallToReturnEdge"},"178->181":{"source":178,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_3_continue","target":181,"line":225,"type":"MultiEdge"},"233->236":{"source":233,"file":"..\/Schreibtisch\/example.c","stmt":"[!(node == 0)]","target":236,"line":289,"type":"AssumeEdge"},"386->388":{"source":386,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":388,"line":473,"type":"CallToReturnEdge"},"233->235":{"source":233,"file":"..\/Schreibtisch\/example.c","stmt":"[node == 0]","target":235,"line":289,"type":"AssumeEdge"},"275->280":{"source":275,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_8_break","target":280,"line":344,"type":"BlankEdge"},"697->698":{"source":697,"file":"..\/Schreibtisch\/example.c","stmt":"gl_destroy();","target":698,"line":834,"type":"CallToReturnEdge"},"199->197":{"source":199,"file":"<none>","stmt":"","target":197,"line":0,"type":"BlankEdge"},"520->527":{"source":520,"file":"..\/Schreibtisch\/example.c","stmt":"*((int *)node) = value; __cil_tmp5 = (unsigned int)node; __cil_tmp6 = __cil_tmp5 + 4; __cil_tmp7 = (struct list_head *)__cil_tmp6;","target":527,"line":638,"type":"MultiEdge"},"172->178":{"source":172,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_2_break __cil_tmp13 = (unsigned int)head; __cil_tmp14 = __cil_tmp13 + 4; __cil_tmp15 = *((const struct list_head **)__cil_tmp14); head = (const struct list_head *)__cil_tmp15; while","target":178,"line":218,"type":"MultiEdge"},"501->502":{"source":501,"file":"<none>","stmt":"Function start dummy edge","target":502,"line":0,"type":"BlankEdge"},"323->326":{"source":323,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_11_continue","target":326,"line":398,"type":"MultiEdge"},"364->367":{"source":364,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp87 == 0)]","target":367,"line":447,"type":"AssumeEdge"},"364->366":{"source":364,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp87 == 0]","target":366,"line":447,"type":"AssumeEdge"},"254->259":{"source":254,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_7_break","target":259,"line":319,"type":"BlankEdge"},"202->204":{"source":202,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_4_break while","target":204,"line":254,"type":"MultiEdge"},"586->590":{"source":586,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp2 = &gl_list; next = *((struct list_head **)__cil_tmp2); __cil_tmp3 = (unsigned int)next; __cil_tmp4 = (unsigned int)(&gl_list);","target":590,"line":705,"type":"MultiEdge"},"561->563":{"source":561,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_19_break","target":563,"line":678,"type":"BlankEdge"},"646->649":{"source":646,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_21_continue","target":649,"line":772,"type":"MultiEdge"},"318->316":{"source":318,"file":"<none>","stmt":"","target":316,"line":0,"type":"BlankEdge"},"672->673":{"source":672,"file":"<none>","stmt":"Function start dummy edge","target":673,"line":0,"type":"BlankEdge"},"384->386":{"source":384,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp96 == 0]","target":386,"line":471,"type":"AssumeEdge"},"145->149":{"source":145,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp3 = (unsigned int)head; __cil_tmp4 = *((const struct list_head **)head); __cil_tmp5 = (unsigned int)__cil_tmp4; __cil_tmp6 = __cil_tmp5 != __cil_tmp3;","target":149,"line":184,"type":"MultiEdge"},"356->359":{"source":356,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_13_continue","target":359,"line":439,"type":"MultiEdge"},"384->387":{"source":384,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp96 == 0)]","target":387,"line":471,"type":"AssumeEdge"},"592->605":{"source":592,"file":"..\/Schreibtisch\/example.c","stmt":" __cil_tmp5 = &gl_list; *((struct list_head **)__cil_tmp5) = *((struct list_head **)next); __cil_tmp6 = (struct node *)0; __cil_tmp7 = (unsigned int)__cil_tmp6; __cil_tmp8 = __cil_tmp7 + 4; __cil_tmp9 = (struct list_head *)__cil_tmp8; __cil_tmp10 = (unsigned long)__cil_tmp9; __cil_tmp11 = (char *)next; __cil_tmp12 = __cil_tmp11 - __cil_tmp10; __cil_tmp13 = (struct node *)__cil_tmp12; __cil_tmp14 = (void *)__cil_tmp13;","target":605,"line":716,"type":"MultiEdge"},"455->453":{"source":455,"file":"..\/Schreibtisch\/example.c","stmt":"unsigned int __cil_tmp4; unsigned int __cil_tmp5; unsigned int __cil_tmp6; unsigned int __cil_tmp7; __cil_tmp4 = (unsigned int)next; __cil_tmp5 = __cil_tmp4 + 4; *((struct list_head **)__cil_tmp5) = new; *((struct list_head **)new) = next; __cil_tmp6 = (unsigned int)new; __cil_tmp7 = __cil_tmp6 + 4; *((struct list_head **)__cil_tmp7) = prev; *((struct list_head **)prev) = new; return;","target":453,"line":556,"type":"MultiEdge"},"673->675":{"source":673,"file":"..\/Schreibtisch\/example.c","stmt":"_Bool tmp; while","target":675,"line":805,"type":"MultiEdge"},"192->196":{"source":192,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp16 = (unsigned int)head; __cil_tmp17 = *((const struct list_head **)head); __cil_tmp18 = (unsigned int)__cil_tmp17; __cil_tmp19 = __cil_tmp18 != __cil_tmp16;","target":196,"line":241,"type":"MultiEdge"},"517->518":{"source":517,"file":"..\/Schreibtisch\/example.c","stmt":"tmp = malloc(__cil_tmp4);","target":518,"line":628,"type":"StatementEdge"},"385->390":{"source":385,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_14_break","target":390,"line":478,"type":"BlankEdge"},"404->409":{"source":404,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_15_break","target":409,"line":501,"type":"BlankEdge"},"521->523":{"source":521,"file":"..\/Schreibtisch\/example.c","stmt":"abort();","target":523,"line":633,"type":"StatementEdge"},"605->606":{"source":605,"file":"..\/Schreibtisch\/example.c","stmt":"free(__cil_tmp14);","target":606,"line":727,"type":"StatementEdge"},"168->170":{"source":168,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":170,"line":211,"type":"CallToReturnEdge"},"155->157":{"source":155,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_1_break while","target":157,"line":197,"type":"MultiEdge"},"332->334":{"source":332,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":334,"line":407,"type":"CallToReturnEdge"},"235->237":{"source":235,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":237,"line":291,"type":"CallToReturnEdge"},"338->341":{"source":338,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_12_continue","target":341,"line":417,"type":"MultiEdge"},"392->395":{"source":392,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_15_continue","target":395,"line":483,"type":"MultiEdge"},"214->219":{"source":214,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_5_break","target":219,"line":273,"type":"BlankEdge"},"160->166":{"source":160,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp7 = (unsigned int)head; __cil_tmp8 = (unsigned int)head; __cil_tmp9 = __cil_tmp8 + 4; __cil_tmp10 = *((const struct list_head **)__cil_tmp9); __cil_tmp11 = (unsigned int)__cil_tmp10; __cil_tmp12 = __cil_tmp11 != __cil_tmp7;","target":166,"line":203,"type":"MultiEdge"},"331->336":{"source":331,"file":"..\/Schreibtisch\/example.c","stmt":"Goto: while_11_break","target":336,"line":412,"type":"BlankEdge"},"652->654":{"source":652,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp10 != __cil_tmp9]","target":654,"line":778,"type":"AssumeEdge"},"187->189":{"source":187,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_3_break while","target":189,"line":235,"type":"MultiEdge"},"652->655":{"source":652,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp10 != __cil_tmp9)]","target":655,"line":778,"type":"AssumeEdge"},"632->646":{"source":632,"file":"..\/Schreibtisch\/example.c","stmt":"_Bool any_change; struct list_head *pos0; struct list_head *pos1; int val0; int tmp; int val1; int tmp___0; struct list_head *__cil_tmp8; unsigned int __cil_tmp9; unsigned int __cil_tmp10; any_change = 0; __cil_tmp8 = &gl_list; pos0 = *((struct list_head **)__cil_tmp8); while","target":646,"line":757,"type":"MultiEdge"},"367->365":{"source":367,"file":"<none>","stmt":"","target":365,"line":0,"type":"BlankEdge"},"558->560":{"source":558,"file":"..\/Schreibtisch\/example.c","stmt":"[!(tmp___0 == 0)]","target":560,"line":676,"type":"AssumeEdge"},"333->331":{"source":333,"file":"<none>","stmt":"","target":331,"line":0,"type":"BlankEdge"},"606->583":{"source":606,"file":"<none>","stmt":"","target":583,"line":0,"type":"BlankEdge"},"558->561":{"source":558,"file":"..\/Schreibtisch\/example.c","stmt":"[tmp___0 == 0]","target":561,"line":676,"type":"AssumeEdge"},"317->319":{"source":317,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":319,"line":388,"type":"CallToReturnEdge"},"348->351":{"source":348,"file":"..\/Schreibtisch\/example.c","stmt":"[!(__cil_tmp82 == 0)]","target":351,"line":427,"type":"AssumeEdge"},"348->350":{"source":348,"file":"..\/Schreibtisch\/example.c","stmt":"[__cil_tmp82 == 0]","target":350,"line":427,"type":"AssumeEdge"},"693->694":{"source":693,"file":"..\/Schreibtisch\/example.c","stmt":"inspect(__cil_tmp1);","target":694,"line":830,"type":"CallToReturnEdge"},"136->138":{"source":136,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":138,"line":172,"type":"CallToReturnEdge"},"157->160":{"source":157,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_2_continue","target":160,"line":200,"type":"MultiEdge"},"430->433":{"source":430,"file":"..\/Schreibtisch\/example.c","stmt":" Label: while_17_continue","target":433,"line":527,"type":"MultiEdge"},"446->448":{"source":446,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":448,"line":543,"type":"CallToReturnEdge"},"296->298":{"source":296,"file":"..\/Schreibtisch\/example.c","stmt":"fail();","target":298,"line":363,"type":"CallToReturnEdge"},"4->5":{"source":4,"file":"..\/Schreibtisch\/example.c","stmt":"__assert_fail(\\\"0\\\", \\\"test-0180.c\\\", 11, \\\"__PRETTY_FUNCTION__\\\");","target":5,"line":35,"type":"StatementEdge"},"433->444":{"source":433,"file":"..\/Schreibtisch\/example.c","stmt":"__cil_tmp112 = (unsigned int)node; __cil_tmp113 = (struct node *)0; __cil_tmp114 = (unsigned int)__cil_tmp113; __cil_tmp115 = __cil_tmp114 + 4; __cil_tmp116 = (struct list_head *)__cil_tmp115; __cil_tmp117 = (unsigned long)__cil_tmp116; __cil_tmp118 = (char *)head; __cil_tmp119 = __cil_tmp118 - __cil_tmp117; __cil_tmp120 = (struct node *)__cil_tmp119; __cil_tmp121 = (unsigned int)__cil_tmp120; __cil_tmp122 = __cil_tmp121 == __cil_tmp112;","target":444,"line":530,"type":"MultiEdge"},"390->392":{"source":390,"file":"..\/Schreibtisch\/example.c","stmt":"Label: while_14_break while","target":392,"line":480,"type":"MultiEdge"}},"nodes":{"1":{"no":1,"func":"fail"},"2":{"no":2,"func":"fail"},"548":{"no":548,"func":"gl_read"},"3":{"no":3,"func":"fail"},"549":{"no":549,"func":"gl_read"},"4":{"no":4,"func":"fail"},"5":{"no":5,"func":"fail"},"547":{"no":547,"func":"gl_read"},"544":{"no":544,"func":"gl_insert"},"7":{"no":7,"func":"inspect"},"8":{"no":8,"func":"inspect"},"558":{"no":558,"func":"gl_read"},"9":{"no":9,"func":"inspect"},"556":{"no":556,"func":"gl_read"},"557":{"no":557,"func":"gl_read"},"555":{"no":555,"func":"gl_read"},"552":{"no":552,"func":"gl_read"},"567":{"no":567,"func":"gl_destroy"},"566":{"no":566,"func":"gl_destroy"},"563":{"no":563,"func":"gl_read"},"561":{"no":561,"func":"gl_read"},"560":{"no":560,"func":"gl_read"},"568":{"no":568,"func":"gl_destroy"},"517":{"no":517,"func":"gl_insert"},"518":{"no":518,"func":"gl_insert"},"519":{"no":519,"func":"gl_insert"},"527":{"no":527,"func":"gl_insert"},"520":{"no":520,"func":"gl_insert"},"521":{"no":521,"func":"gl_insert"},"522":{"no":522,"func":"gl_insert"},"523":{"no":523,"func":"gl_insert"},"532":{"no":532,"func":"gl_insert"},"529":{"no":529,"func":"gl_insert"},"528":{"no":528,"func":"gl_insert"},"610":{"no":610,"func":"val_from_node"},"611":{"no":611,"func":"val_from_node"},"612":{"no":612,"func":"val_from_node"},"631":{"no":631,"func":"gl_sort_pass"},"630":{"no":630,"func":"gl_sort_pass"},"632":{"no":632,"func":"gl_sort_pass"},"583":{"no":583,"func":"gl_destroy"},"586":{"no":586,"func":"gl_destroy"},"590":{"no":590,"func":"gl_destroy"},"593":{"no":593,"func":"gl_destroy"},"592":{"no":592,"func":"gl_destroy"},"605":{"no":605,"func":"gl_destroy"},"607":{"no":607,"func":"gl_destroy"},"606":{"no":606,"func":"gl_destroy"},"687":{"no":687,"func":"main"},"137":{"no":137,"func":"inspect"},"136":{"no":136,"func":"inspect"},"138":{"no":138,"func":"inspect"},"684":{"no":684,"func":"gl_sort"},"140":{"no":140,"func":"inspect"},"682":{"no":682,"func":"gl_sort"},"681":{"no":681,"func":"gl_sort"},"142":{"no":142,"func":"inspect"},"679":{"no":679,"func":"gl_sort"},"678":{"no":678,"func":"gl_sort"},"131":{"no":131,"func":"inspect"},"675":{"no":675,"func":"gl_sort"},"135":{"no":135,"func":"inspect"},"673":{"no":673,"func":"gl_sort"},"134":{"no":134,"func":"inspect"},"672":{"no":672,"func":"gl_sort"},"152":{"no":152,"func":"inspect"},"153":{"no":153,"func":"inspect"},"700":{"no":700,"func":"main"},"155":{"no":155,"func":"inspect"},"698":{"no":698,"func":"main"},"157":{"no":157,"func":"inspect"},"696":{"no":696,"func":"main"},"697":{"no":697,"func":"main"},"694":{"no":694,"func":"main"},"695":{"no":695,"func":"main"},"145":{"no":145,"func":"inspect"},"692":{"no":692,"func":"main"},"693":{"no":693,"func":"main"},"691":{"no":691,"func":"main"},"149":{"no":149,"func":"inspect"},"688":{"no":688,"func":"main"},"150":{"no":150,"func":"inspect"},"151":{"no":151,"func":"inspect"},"653":{"no":653,"func":"gl_sort_pass"},"170":{"no":170,"func":"inspect"},"652":{"no":652,"func":"gl_sort_pass"},"169":{"no":169,"func":"inspect"},"655":{"no":655,"func":"gl_sort_pass"},"168":{"no":168,"func":"inspect"},"654":{"no":654,"func":"gl_sort_pass"},"649":{"no":649,"func":"gl_sort_pass"},"172":{"no":172,"func":"inspect"},"160":{"no":160,"func":"inspect"},"646":{"no":646,"func":"gl_sort_pass"},"167":{"no":167,"func":"inspect"},"166":{"no":166,"func":"inspect"},"668":{"no":668,"func":"gl_sort_pass"},"187":{"no":187,"func":"inspect"},"184":{"no":184,"func":"inspect"},"185":{"no":185,"func":"inspect"},"671":{"no":671,"func":"gl_sort"},"666":{"no":666,"func":"gl_sort_pass"},"667":{"no":667,"func":"gl_sort_pass"},"189":{"no":189,"func":"inspect"},"178":{"no":178,"func":"inspect"},"660":{"no":660,"func":"gl_sort_pass"},"662":{"no":662,"func":"gl_sort_pass"},"663":{"no":663,"func":"gl_sort_pass"},"182":{"no":182,"func":"inspect"},"183":{"no":183,"func":"inspect"},"657":{"no":657,"func":"gl_sort_pass"},"658":{"no":658,"func":"gl_sort_pass"},"181":{"no":181,"func":"inspect"},"659":{"no":659,"func":"gl_sort_pass"},"204":{"no":204,"func":"inspect"},"207":{"no":207,"func":"inspect"},"200":{"no":200,"func":"inspect"},"202":{"no":202,"func":"inspect"},"197":{"no":197,"func":"inspect"},"196":{"no":196,"func":"inspect"},"199":{"no":199,"func":"inspect"},"198":{"no":198,"func":"inspect"},"192":{"no":192,"func":"inspect"},"216":{"no":216,"func":"inspect"},"217":{"no":217,"func":"inspect"},"219":{"no":219,"func":"inspect"},"213":{"no":213,"func":"inspect"},"214":{"no":214,"func":"inspect"},"215":{"no":215,"func":"inspect"},"239":{"no":239,"func":"inspect"},"237":{"no":237,"func":"inspect"},"236":{"no":236,"func":"inspect"},"235":{"no":235,"func":"inspect"},"234":{"no":234,"func":"inspect"},"233":{"no":233,"func":"inspect"},"230":{"no":230,"func":"inspect"},"254":{"no":254,"func":"inspect"},"255":{"no":255,"func":"inspect"},"253":{"no":253,"func":"inspect"},"244":{"no":244,"func":"inspect"},"241":{"no":241,"func":"inspect"},"275":{"no":275,"func":"inspect"},"274":{"no":274,"func":"inspect"},"278":{"no":278,"func":"inspect"},"277":{"no":277,"func":"inspect"},"276":{"no":276,"func":"inspect"},"282":{"no":282,"func":"inspect"},"280":{"no":280,"func":"inspect"},"285":{"no":285,"func":"inspect"},"259":{"no":259,"func":"inspect"},"256":{"no":256,"func":"inspect"},"257":{"no":257,"func":"inspect"},"261":{"no":261,"func":"inspect"},"264":{"no":264,"func":"inspect"},"305":{"no":305,"func":"inspect"},"315":{"no":315,"func":"inspect"},"317":{"no":317,"func":"inspect"},"316":{"no":316,"func":"inspect"},"319":{"no":319,"func":"inspect"},"318":{"no":318,"func":"inspect"},"294":{"no":294,"func":"inspect"},"295":{"no":295,"func":"inspect"},"296":{"no":296,"func":"inspect"},"297":{"no":297,"func":"inspect"},"298":{"no":298,"func":"inspect"},"300":{"no":300,"func":"inspect"},"302":{"no":302,"func":"inspect"},"341":{"no":341,"func":"inspect"},"338":{"no":338,"func":"inspect"},"336":{"no":336,"func":"inspect"},"351":{"no":351,"func":"inspect"},"350":{"no":350,"func":"inspect"},"349":{"no":349,"func":"inspect"},"348":{"no":348,"func":"inspect"},"326":{"no":326,"func":"inspect"},"323":{"no":323,"func":"inspect"},"321":{"no":321,"func":"inspect"},"334":{"no":334,"func":"inspect"},"332":{"no":332,"func":"inspect"},"333":{"no":333,"func":"inspect"},"330":{"no":330,"func":"inspect"},"331":{"no":331,"func":"inspect"},"372":{"no":372,"func":"inspect"},"375":{"no":375,"func":"inspect"},"368":{"no":368,"func":"inspect"},"370":{"no":370,"func":"inspect"},"356":{"no":356,"func":"inspect"},"359":{"no":359,"func":"inspect"},"352":{"no":352,"func":"inspect"},"354":{"no":354,"func":"inspect"},"364":{"no":364,"func":"inspect"},"365":{"no":365,"func":"inspect"},"366":{"no":366,"func":"inspect"},"367":{"no":367,"func":"inspect"},"409":{"no":409,"func":"inspect"},"413":{"no":413,"func":"inspect"},"403":{"no":403,"func":"inspect"},"406":{"no":406,"func":"inspect"},"407":{"no":407,"func":"inspect"},"404":{"no":404,"func":"inspect"},"405":{"no":405,"func":"inspect"},"395":{"no":395,"func":"inspect"},"392":{"no":392,"func":"inspect"},"387":{"no":387,"func":"inspect"},"386":{"no":386,"func":"inspect"},"385":{"no":385,"func":"inspect"},"384":{"no":384,"func":"inspect"},"390":{"no":390,"func":"inspect"},"388":{"no":388,"func":"inspect"},"444":{"no":444,"func":"inspect"},"445":{"no":445,"func":"inspect"},"446":{"no":446,"func":"inspect"},"447":{"no":447,"func":"inspect"},"433":{"no":433,"func":"inspect"},"424":{"no":424,"func":"inspect"},"428":{"no":428,"func":"inspect"},"430":{"no":430,"func":"inspect"},"416":{"no":416,"func":"inspect"},"421":{"no":421,"func":"inspect"},"423":{"no":423,"func":"inspect"},"479":{"no":479,"func":"list_add"},"470":{"no":470,"func":"__list_del"},"471":{"no":471,"func":"__list_del"},"469":{"no":469,"func":"__list_del"},"455":{"no":455,"func":"__list_add"},"454":{"no":454,"func":"__list_add"},"453":{"no":453,"func":"__list_add"},"450":{"no":450,"func":"inspect"},"448":{"no":448,"func":"inspect"},"500":{"no":500,"func":"gl_insert"},"501":{"no":501,"func":"gl_insert"},"502":{"no":502,"func":"gl_insert"},"496":{"no":496,"func":"list_move"},"497":{"no":497,"func":"list_move"},"498":{"no":498,"func":"list_move"},"488":{"no":488,"func":"list_move"},"484":{"no":484,"func":"list_add"},"487":{"no":487,"func":"list_move"},"486":{"no":486,"func":"list_move"},"481":{"no":481,"func":"list_add"},"480":{"no":480,"func":"list_add"},"483":{"no":483,"func":"list_add"}}};
var errorPathData = [{"val":"","desc":"INIT GLOBAL VARS","source":688,"file":"<none>","target":700,"line":0,"argelem":0},{"val":"((signed long long int)(&gl_list)) == 1LL;\n","desc":"void __VERIFIER_error(); void __assert_fail(const char *__assertion, const char *__file, unsigned int __line, const char *__function); void __assert_perror_fail(int __errnum, const char *__file, unsigned int __line, const char *__function); void __assert(const char *__assertion, const char *__file, int __line); typedef unsigned int size_t; struct list_head {   struct list_head *next;   struct list_head *prev; } ; struct node {   int value;   struct list_head linkage;   struct list_head nested; } ; void * malloc(size_t __size); void free(void *__ptr); void abort(); int __VERIFIER_nondet_int(); void fail(); struct list_head gl_list = { &gl_list, &gl_list }; void inspect(const struct list_head *head); void __list_add(struct list_head *new, struct list_head *prev, struct list_head *next); void __list_del(struct list_head *prev, struct list_head *next); void list_add(struct list_head *new, struct list_head *head); void list_move(struct list_head *list, struct list_head *head); void gl_insert(int value); void gl_read(); void gl_destroy(); int val_from_node(struct list_head *head); _Bool gl_sort_pass(); void gl_sort(); int main(); Function start dummy edge const struct list_head *__cil_tmp1; const struct list_head *__cil_tmp2;","source":700,"file":"..\/Schreibtisch\/example.c","target":691,"line":1,"argelem":51},{"val":"","desc":"gl_read()","source":691,"file":"..\/Schreibtisch\/example.c","target":548,"line":828,"argelem":52},{"val":"","desc":"Function start dummy edge","source":548,"file":"<none>","target":549,"line":0,"argelem":53},{"val":"","desc":"int tmp; int tmp___0; while","source":549,"file":"..\/Schreibtisch\/example.c","target":552,"line":665,"argelem":54},{"val":"","desc":" Label: while_19_continue","source":552,"file":"..\/Schreibtisch\/example.c","target":555,"line":669,"argelem":102},{"val":"tmp == 22;\n","desc":"tmp = __VERIFIER_nondet_int();","source":555,"file":"..\/Schreibtisch\/example.c","target":556,"line":672,"argelem":103},{"val":"","desc":"gl_insert(tmp)","source":556,"file":"..\/Schreibtisch\/example.c","target":501,"line":673,"argelem":104},{"val":"value == 22;\n","desc":"Function start dummy edge","source":501,"file":"<none>","target":502,"line":0,"argelem":105},{"val":"__cil_tmp4 == 20U;\n","desc":"struct node *node; void *tmp; unsigned int __cil_tmp4; unsigned int __cil_tmp5; unsigned int __cil_tmp6; struct list_head *__cil_tmp7; unsigned int __cil_tmp8; unsigned int __cil_tmp9; unsigned int __cil_tmp10; unsigned int __cil_tmp11; unsigned int __cil_tmp12; unsigned int __cil_tmp13; unsigned int __cil_tmp14; unsigned int __cil_tmp15; __cil_tmp4 = 20U;","source":502,"file":"..\/Schreibtisch\/example.c","target":517,"line":611,"argelem":106},{"val":"tmp == 9LL;\n","desc":"tmp = malloc(__cil_tmp4);","source":517,"file":"..\/Schreibtisch\/example.c","target":518,"line":628,"argelem":107},{"val":"node == 9LL;\n((signed long long int)(&(node->linkage))) == 13LL;\n((signed long long int)(&(node->nested))) == 21LL;\n","desc":"node = (struct node *)tmp;","source":518,"file":"..\/Schreibtisch\/example.c","target":519,"line":629,"argelem":108},{"val":"node == 9LL;\n((signed long long int)(&(node->linkage))) == 13LL;\n((signed long long int)(&(node->nested))) == 21LL;","desc":"[!(node == 0)]","source":519,"file":"..\/Schreibtisch\/example.c","target":522,"line":631,"argelem":109},{"val":"","desc":"","source":522,"file":"<none>","target":520,"line":0,"argelem":111},{"val":"(*((int *)node)) == 22;\n__cil_tmp7 == 13LL;\n__cil_tmp5 == 9U;\n__cil_tmp6 == 13U;\n","desc":"*((int *)node) = value; __cil_tmp5 = (unsigned int)node; __cil_tmp6 = __cil_tmp5 + 4; __cil_tmp7 = (struct list_head *)__cil_tmp6;","source":520,"file":"..\/Schreibtisch\/example.c","target":527,"line":638,"argelem":112},{"val":"","desc":"list_add(__cil_tmp7, &gl_list)","source":527,"file":"..\/Schreibtisch\/example.c","target":480,"line":642,"argelem":113},{"val":"new == 13LL;\nhead == 1LL;\n","desc":"Function start dummy edge","source":480,"file":"<none>","target":481,"line":0,"argelem":114},{"val":"__cil_tmp3 == 0LL;\n","desc":"struct list_head *__cil_tmp3; __cil_tmp3 = *((struct list_head **)head);","source":481,"file":"..\/Schreibtisch\/example.c","target":483,"line":584,"argelem":115},{"val":"","desc":"__list_add(new, head, __cil_tmp3)","source":483,"file":"..\/Schreibtisch\/example.c","target":454,"line":588,"argelem":116},{"val":"new == 13LL;\nprev == 1LL;\n(prev->next) == 0LL;\nnext == 0LL;\n","desc":"Function start dummy edge","source":454,"file":"<none>","target":455,"line":0,"argelem":117},{"val":"((*((struct list_head **)new))->prev->prev->next) == 13LL;\n((*((struct list_head **)__cil_tmp7))->next->prev) == 1LL;\n((*((struct list_head **)__cil_tmp5))->next->prev) == 13LL;\n((*((struct list_head **)prev))->prev->next) == 13LL;\n((*((struct list_head **)prev))->next) == 0LL;\n(*((struct list_head **)__cil_tmp7)) == 1LL;\n(*((struct list_head **)__cil_tmp5)) == 13LL;\n(*((struct list_head **)new)) == 0LL;\n((*((struct list_head **)prev))->prev) == 1LL;\n((*((struct list_head **)__cil_tmp7))->next) == 13LL;\n((*((struct list_head **)__cil_tmp5))->next) == 0LL;\n(*((struct list_head **)prev)) == 13LL;\n((*((struct list_head **)new))->prev) == 13LL;\n((*((struct list_head **)prev))->next->prev) == 13LL;\n((*((struct list_head **)new))->prev->next) == 0LL;\n((*((struct list_head **)__cil_tmp7))->next->next->prev) == 13LL;\n((*((struct list_head **)__cil_tmp7))->next->next) == 0LL;\n__cil_tmp4 == 0U;\n((*((struct list_head **)__cil_tmp5))->prev->next) == 13LL;\n((*((struct list_head **)new))->prev->prev) == 1LL;\n__cil_tmp5 == 4U;\n__cil_tmp7 == 17U;\n((*((struct list_head **)__cil_tmp5))->prev) == 1LL;\n__cil_tmp6 == 13U;\n","desc":"unsigned int __cil_tmp4; unsigned int __cil_tmp5; unsigned int __cil_tmp6; unsigned int __cil_tmp7; __cil_tmp4 = (unsigned int)next; __cil_tmp5 = __cil_tmp4 + 4; *((struct list_head **)__cil_tmp5) = new; *((struct list_head **)new) = next; __cil_tmp6 = (unsigned int)new; __cil_tmp7 = __cil_tmp6 + 4; *((struct list_head **)__cil_tmp7) = prev; *((struct list_head **)prev) = new; return;","source":455,"file":"..\/Schreibtisch\/example.c","target":453,"line":556,"argelem":118},{"val":"","desc":"Return edge from __list_add to list_add","source":453,"file":"..\/Schreibtisch\/example.c","target":484,"line":588,"argelem":119},{"val":"","desc":"return;","source":484,"file":"..\/Schreibtisch\/example.c","target":479,"line":590,"argelem":120},{"val":"","desc":"Return edge from list_add to gl_insert","source":479,"file":"..\/Schreibtisch\/example.c","target":528,"line":642,"argelem":121},{"val":"","desc":"while","source":528,"file":"..\/Schreibtisch\/example.c","target":529,"line":645,"argelem":122},{"val":"","desc":" Label: while_18_continue","source":529,"file":"..\/Schreibtisch\/example.c","target":532,"line":645,"argelem":123},{"val":"__cil_tmp8 == 9U;\n__cil_tmp10 == 9U;\n((*((struct list_head **)__cil_tmp13))->next) == 21LL;\n__cil_tmp12 == 9U;\n((*((struct list_head **)__cil_tmp9))->next) == 21LL;\n__cil_tmp15 == 21U;\n__cil_tmp14 == 9U;\n(*((struct list_head **)__cil_tmp9)) == 21LL;\n(*((struct list_head **)__cil_tmp13)) == 21LL;\n__cil_tmp13 == 21U;\n__cil_tmp11 == 21U;\n__cil_tmp9 == 21U;\n","desc":"__cil_tmp8 = (unsigned int)node; __cil_tmp9 = __cil_tmp8 + 12; __cil_tmp10 = (unsigned int)node; __cil_tmp11 = __cil_tmp10 + 12; *((struct list_head **)__cil_tmp9) = (struct list_head *)__cil_tmp11; __cil_tmp12 = (unsigned int)node; __cil_tmp13 = __cil_tmp12 + 12; __cil_tmp14 = (unsigned int)node; __cil_tmp15 = __cil_tmp14 + 12; *((struct list_head **)__cil_tmp13) = (struct list_head *)__cil_tmp15; Goto: while_18_break","source":532,"file":"..\/Schreibtisch\/example.c","target":544,"line":647,"argelem":124},{"val":"","desc":"Label: while_18_break return;","source":544,"file":"..\/Schreibtisch\/example.c","target":500,"line":659,"argelem":125},{"val":"","desc":"Return edge from gl_insert to gl_read","source":500,"file":"..\/Schreibtisch\/example.c","target":557,"line":673,"argelem":126},{"val":"tmp___0 == 0;\n","desc":"tmp___0 = __VERIFIER_nondet_int();","source":557,"file":"..\/Schreibtisch\/example.c","target":558,"line":674,"argelem":127},{"val":"tmp___0 == 0;","desc":"[tmp___0 == 0]","source":558,"file":"..\/Schreibtisch\/example.c","target":561,"line":676,"argelem":128},{"val":"","desc":"Goto: while_19_break","source":561,"file":"..\/Schreibtisch\/example.c","target":563,"line":678,"argelem":129},{"val":"","desc":"Label: while_19_break return;","source":563,"file":"..\/Schreibtisch\/example.c","target":547,"line":681,"argelem":133},{"val":"","desc":"Return edge from gl_read to main","source":547,"file":"..\/Schreibtisch\/example.c","target":692,"line":828,"argelem":134},{"val":"__cil_tmp1 == 1LL;\n(__cil_tmp1->next) == 1LL;\n","desc":"__cil_tmp1 = (const struct list_head *)(&gl_list);","source":692,"file":"..\/Schreibtisch\/example.c","target":693,"line":829,"argelem":135},{"val":"","desc":"inspect(__cil_tmp1)","source":693,"file":"..\/Schreibtisch\/example.c","target":8,"line":830,"argelem":136},{"val":"head == 1LL;\n(head->next) == 1LL;\n","desc":"Function start dummy edge","source":8,"file":"<none>","target":9,"line":0,"argelem":137},{"val":"","desc":"const struct node *node; unsigned int __cil_tmp3; struct list_head *__cil_tmp4; unsigned int __cil_tmp5; int __cil_tmp6; unsigned int __cil_tmp7; unsigned int __cil_tmp8; unsigned int __cil_tmp9; struct list_head *__cil_tmp10; unsigned int __cil_tmp11; int __cil_tmp12; unsigned int __cil_tmp13; unsigned int __cil_tmp14; struct list_head *__cil_tmp15; unsigned int __cil_tmp16; struct list_head *__cil_tmp17; unsigned int __cil_tmp18; int __cil_tmp19; unsigned int __cil_tmp20; unsigned int __cil_tmp21; unsigned int __cil_tmp22; struct list_head *__cil_tmp23; unsigned int __cil_tmp24; int __cil_tmp25; struct node *__cil_tmp26; unsigned int __cil_tmp27; unsigned int __cil_tmp28; struct list_head *__cil_tmp29; unsigned long __cil_tmp30; char *__cil_tmp31; char *__cil_tmp32; struct node *__cil_tmp33; unsigned int __cil_tmp34; unsigned int __cil_tmp35; const struct list_head *__cil_tmp36; unsigned int __cil_tmp37; unsigned int __cil_tmp38; unsigned int __cil_tmp39; struct list_head *__cil_tmp40; unsigned int __cil_tmp41; int __cil_tmp42; unsigned int __cil_tmp43; unsigned int __cil_tmp44; const struct list_head *__cil_tmp45; unsigned int __cil_tmp46; unsigned int __cil_tmp47; unsigned int __cil_tmp48; unsigned int __cil_tmp49; struct list_head *__cil_tmp50; unsigned int __cil_tmp51; int __cil_tmp52; unsigned int __cil_tmp53; unsigned int __cil_tmp54; const struct list_head *__cil_tmp55; unsigned int __cil_tmp56; unsigned int __cil_tmp57; unsigned int __cil_tmp58; struct list_head *__cil_tmp59; unsigned int __cil_tmp60; int __cil_tmp61; unsigned int __cil_tmp62; unsigned int __cil_tmp63; const struct list_head *__cil_tmp64; unsigned int __cil_tmp65; unsigned int __cil_tmp66; unsigned int __cil_tmp67; unsigned int __cil_tmp68; struct list_head *__cil_tmp69; unsigned int __cil_tmp70; int __cil_tmp71; const struct node *__cil_tmp72; unsigned int __cil_tmp73; unsigned int __cil_tmp74; int __cil_tmp75; unsigned int __cil_tmp76; unsigned int __cil_tmp77; const struct list_head *__cil_tmp78; const struct node *__cil_tmp79; unsigned int __cil_tmp80; unsigned int __cil_tmp81; int __cil_tmp82; const int *__cil_tmp83; const struct node *__cil_tmp84; unsigned int __cil_tmp85; unsigned int __cil_tmp86; int __cil_tmp87; unsigned int __cil_tmp88; unsigned int __cil_tmp89; struct list_head *__cil_tmp90; unsigned int __cil_tmp91; unsigned int __cil_tmp92; struct list_head *__cil_tmp93; unsigned int __cil_tmp94; unsigned int __cil_tmp95; int __cil_tmp96; unsigned int __cil_tmp97; unsigned int __cil_tmp98; unsigned int __cil_tmp99; struct list_head *__cil_tmp100; struct list_head *__cil_tmp101; unsigned int __cil_tmp102; unsigned int __cil_tmp103; int __cil_tmp104; struct list_head *__cil_tmp105; unsigned int __cil_tmp106; unsigned int __cil_tmp107; unsigned int __cil_tmp108; const struct list_head *__cil_tmp109; unsigned int __cil_tmp110; struct list_head *__cil_tmp111; unsigned int __cil_tmp112; struct node *__cil_tmp113; unsigned int __cil_tmp114; unsigned int __cil_tmp115; struct list_head *__cil_tmp116; unsigned long __cil_tmp117; char *__cil_tmp118; char *__cil_tmp119; struct node *__cil_tmp120; unsigned int __cil_tmp121; int __cil_tmp122; while","source":9,"file":"..\/Schreibtisch\/example.c","target":131,"line":44,"argelem":138},{"val":"","desc":" Label: while_0_continue","source":131,"file":"..\/Schreibtisch\/example.c","target":134,"line":168,"argelem":139},{"val":"head == 1LL;\n(head->next) == 1LL;","desc":"[!(head == 0)]","source":134,"file":"..\/Schreibtisch\/example.c","target":137,"line":170,"argelem":140},{"val":"","desc":"","source":137,"file":"<none>","target":135,"line":0,"argelem":142},{"val":"","desc":"Goto: while_0_break","source":135,"file":"..\/Schreibtisch\/example.c","target":140,"line":176,"argelem":143},{"val":"","desc":"Label: while_0_break while","source":140,"file":"..\/Schreibtisch\/example.c","target":142,"line":178,"argelem":146},{"val":"","desc":" Label: while_1_continue","source":142,"file":"..\/Schreibtisch\/example.c","target":145,"line":181,"argelem":147},{"val":"__cil_tmp3 == 1U;\n(__cil_tmp4->next) == 1LL;\n__cil_tmp4 == 1LL;\n__cil_tmp5 == 1U;\n__cil_tmp6 == 0;\n","desc":"__cil_tmp3 = (unsigned int)head; __cil_tmp4 = *((const struct list_head **)head); __cil_tmp5 = (unsigned int)__cil_tmp4; __cil_tmp6 = __cil_tmp5 != __cil_tmp3;","source":145,"file":"..\/Schreibtisch\/example.c","target":149,"line":184,"argelem":148},{"val":"__cil_tmp6 == 0;","desc":"[__cil_tmp6 == 0]","source":149,"file":"..\/Schreibtisch\/example.c","target":151,"line":188,"argelem":149},{"val":"","desc":"fail()","source":151,"file":"..\/Schreibtisch\/example.c","target":1,"line":190,"argelem":150},{"val":"","desc":"Function start dummy edge","source":1,"file":"<none>","target":2,"line":0,"argelem":153},{"val":"","desc":"Label: ERROR","source":2,"file":"..\/Schreibtisch\/example.c","target":3,"line":35,"argelem":154},{"val":"","desc":"__VERIFIER_error();","source":3,"file":"..\/Schreibtisch\/example.c","target":4,"line":35,"argelem":155}];
var combinedNodes = {"137":137,"275":277,"409":406,"4":4,"140":137,"5":4,"544":532,"277":277,"280":277,"406":406,"404":406,"135":137,"152":152,"259":256,"256":256,"155":152,"387":387,"385":387,"390":387,"150":152,"517":502,"169":169,"655":655,"518":502,"445":447,"447":447,"172":169,"167":169,"316":318,"318":318,"668":655,"424":424,"532":532,"187":184,"184":184,"428":424,"295":297,"297":297,"182":184,"300":297,"336":333,"202":199,"351":351,"197":199,"349":351,"199":199,"216":216,"219":216,"321":318,"455":454,"454":454,"214":216,"333":333,"450":447,"331":333,"239":236,"236":236,"234":236,"370":367,"502":502,"593":593,"254":256,"354":351,"365":367,"367":367,"605":605,"607":593,"606":605};

var help_externalFiles = "CFA (control flow automaton) shows the control flow of the program (one cfa for one function in the source-code)\n" +
    " - the errorpath is highlighted in red\n" +
    " - click on the 'function'-nodes to jump to CFA of this function\n - click on edges to jump to the relating line in the source-code\n\n" +
    "ARG shows the errorpath as a graph\n" +
    " - the errorpath is highlighted in red\n" +
    "- click on nodes to jump to the relating node in the CFA\n " +
    "- click on edge to jump to the relating line in the source-code";
var help_errorpath = "The errorpath leads to the error 'line by line' (Source) or 'edge by edge' (CFA)\n\n" +
    "left column: the source-node of the relating edge in the CFA\n" +
    " - click on the number : show all initialized variables and their values at that point\n\n" +
    "right column: the description (what is executed at this point)\n" +
    " - click on the text : jump to the relating edge in the CFA or node in the ARG or line in Source (depending on active tab)\n\n" +
    "Buttons (Prev, Start, Next) : click to navigate through the errorpath and jump to the relating position in the active tab\n\n" +
    "Search : you can search for words or numbers in the 'description'-part (blue)\n  and you can search for variables and their value - it will only show you, where the variable has been initialized or where it has changed its value (green)\n" +
    "tip: if you search for the (full) name of a variable, add a blank space at the end";

$(function () {
    $('[data-toggle="popover"]').popover()
})

function init(){
    var svgElements = document.getElementsByTagName("svg");
    //set IDs for all CFA-SVGs
    for(var r = 0; r<svgElements.length-1; r++){
        var graph = svgElements[r].getElementsByTagName("g")[0];
        graph.id = "cfaGraph-" + r.toString();
        var nodes = graph.getElementsByClassName("node");
        for(var s = 0; s < nodes.length; s++){
            nodes[s].id = "cfa-" + nodes[s].getElementsByTagName("title")[0].innerHTML;
            if(nodes[s].getElementsByTagName("title")[0].innerHTML > 100000){
                nodes[s].classList.add("functionNode");
            }
        }
        var edges = graph.getElementsByClassName("edge");
        for(var t=0; t<edges.length; t++){
            var edge = edges[t];
            var fromto = [];
            if(edge.getElementsByTagName("title")[0].innerHTML.split("&#45;&gt;")[1] != null){
                fromto = edge.getElementsByTagName("title")[0].innerHTML.split("&#45;&gt;");
            } else if (edge.getElementsByTagName("title")[0].innerHTML.split("&#45;>")[1] != null) {
                fromto = edge.getElementsByTagName("title")[0].innerHTML.split("&#45;>");
            } else if (edge.getElementsByTagName("title")[0].innerHTML.split("-&gt;")[1] != null) {
                fromto = edge.getElementsByTagName("title")[0].innerHTML.split("-&gt;");
            } else {
                fromto = edge.getElementsByTagName("title")[0].innerHTML.split("->");
            }
            edge.id = "cfa-" + fromto[0] + "->" + fromto[1];
        }
    }
    //set IDs for the ARG-SVG
    graph = svgElements[svgElements.length-1].getElementsByTagName("g")[0];
    graph.id = "argGraph-" + (svgElements.length-1).toString();
    nodes = graph.getElementsByClassName("node");
    for(var u = 0; u < nodes.length; u++){
        nodes[u].id = "arg-" + nodes[u].getElementsByTagName("title")[0].innerHTML;
    }
    edges = graph.getElementsByClassName("edge");
    for(var v=0; v<edges.length; v++){
        edge = edges[v];
        fromto = [];
        if(edge.getElementsByTagName("title")[0].innerHTML.split("&#45;&gt;")[1] != null){
            fromto = edge.getElementsByTagName("title")[0].innerHTML.split("&#45;&gt;");
        } else if (edge.getElementsByTagName("title")[0].innerHTML.split("&#45;>")[1] != null) {
            fromto = edge.getElementsByTagName("title")[0].innerHTML.split("&#45;>");
        } else if (edge.getElementsByTagName("title")[0].innerHTML.split("-&gt;")[1] != null) {
            fromto = edge.getElementsByTagName("title")[0].innerHTML.split("-&gt;");
        } else {
            fromto = edge.getElementsByTagName("title")[0].innerHTML.split("->");
        }
        edge.id = "arg-" + fromto[0] + "->" + fromto[1];
    }

    //prepare Errorpath-Data for marking in the cfa
    var returnedges = {};
    for(key in fCallEdges){
        var fcalledge = fCallEdges[key];
        returnedges[fcalledge[1]] = fcalledge[0];
    }
    var errPathDataForCFA = [];
    for(var w = 0; w < errorPathData.length; w++){
        var source = errorPathData[w].source;
        var target = errorPathData[w].target;
        if(source in combinedNodes && target in combinedNodes){

        }
        else if(source in combinedNodes){
            errPathDataForCFA.push(combinedNodes[source] + "->" + target);
        }
        else if (source in fCallEdges){
            errPathDataForCFA.push(source + "->" + fCallEdges[source][0]);
        }
        else if (target in returnedges){
            errPathDataForCFA.push(returnedges[target] + "->" + target);
        } else {
            errPathDataForCFA.push(source + "->" + target);
        }
    }
    for(var x = 0; x < errPathDataForCFA.length; x++){
        var cfaEdge = document.getElementById("cfa-" + errPathDataForCFA[x]);
        var path = cfaEdge.getElementsByTagName("path")[0];
        var poly = cfaEdge.getElementsByTagName("polygon")[0];
        var text = cfaEdge.getElementsByTagName("text")[0];
        path.setAttribute("stroke", "red");
        poly.setAttribute("stroke", "red");
        poly.setAttribute("fill", "red");
        if(text != undefined) {
            text.setAttribute("fill", "red");
        }
    }
};


