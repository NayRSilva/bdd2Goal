

var model = null;
var links = null;

var goals = [];
var dependencies = new Array();
var tasks = new Array();

let allGoals=[];

var arrayScenarios = new Array();

let penaltyW=1;
let benefitW=2;
let costW=1;
let riskW=0.5;

var goalColours = {
    'true' : '#6CFA4B',
    'false': '#FA7267'
};

function getBenefitWeight(weight){
    benefitW = weight;

}

function getPenaltyWeight(weight){
    penaltyW = weight;

}

function getCostWeight(weight){
    costW = weight;


}
function getRiskWeight(weight){
    riskW = weight;

}

function calculatePath(){
    priorityTree(true);
    let paths = [];

    // prioritizeAutomatically()

    let i = {number:0}
    pathDFD2(goals[0], paths, [], [], i)
    printSequencePaths(paths)
    
}

function priorityTree(needBddResult = false){

    if(needBddResult){
        proccessTree();
    }
    else{
        tasks = [];
        allGoals = [];
        readTree();

    }


    let a;
    calculateTaskProperties(penaltyW, benefitW, costW, riskW);
    propagatePriority(goals[0])

    prioritizeAutomatically()
    

}


function proccessTree() {


    tasks = [];
    allGoals = [];
    readTree();

    let a;
    a = isExequivel(goals[0]);

}

function propagatePriority(goal){
    //pegar das folhas e subir
    let isAnd = false;

    let result= 0;
    let goalChildren = goal.children.filter((c) => c.type == 'Goal')


    while(goalChildren.length>0){
        let g = goalChildren.pop();
        propagatePriority(g);
    }

    //considering only tasks or that goals have already priority
    for (let i = 0; i < goal.children.length; i++){
        //first we need to find all children that are goals

        //after all goal children are found we go to task children
        let c = goal.children[i];
        if(c.type == 'Goal'){
            result = parseFloat(c.priority);
        }
        else{
            result = parseFloat(getFactorValue(c.id, "priority"))  

        }
      
        let linkarray=[]

        isOrRefinement(goal, linkarray);
        if(linkarray.length>0){//if relationship is OR
            if(goal.priority==null){
                //At OR if goal.result = null it needes to receive the first task result
                goal.priority = result
            }
            else{
                if(goal.priority<result){
                    goal.priority = result;
                }
            }

        }
        else{//if relationship is AND
            isAnd = true;
            if(goal.priority==null){
                //At OR if goal.result = null it needes to receive the first task result
                goal.priority = result;
            }
            else{
                isAnd = true;
                goal.priority = ((parseFloat(goal.priority)) + (result));

            }

        }      
        
    }
    if(isAnd){
        goal.priority = (goal.priority/goal.children.length);
    }
    goal.priority = goal.priority.toFixed(2)
    ui.changeCustomPropertyValue(istar.getCellById(goal.id), 'priority', String(goal.priority));
    return goal.priority;

}

function printSequencePaths(paths){

    var printable=new Array();

    paths.forEach(path =>{
        let goals=[]
        let tasks =[];
        path.forEach(p =>{
            if(p.type =='Goal'){
                goals.push(p)
            }
            else{
                tasks.push(p)
            }

        })

        let printnode  = {};
        printnode.goals= goals
        printnode.tasks = tasks;
        if(printable.length==0){
            printable.push(printnode);

        }
        else{
            let lastIndex = printable.length;
            let auxprint = printable[lastIndex-1];
            let equal = true;
            if(auxprint.goals.length!= printnode.goals.length){
                printable.push(printnode)
            }
            else{


                let aux = auxprint.goals.filter(stablishedGoal =>{
                    let aux2 =(printnode.goals.find(newGoal =>{
                        if(newGoal.name == stablishedGoal.name) return true
                    }))

                    

                    if(!aux2)return false
                    return true


                })


                if(aux.length == printnode.goals.length){
                    printnode.tasks.forEach(task =>{

                        printable[lastIndex-1].tasks.push(task)
                    })
                }
                else{
                    printable.push(printnode)
                }

            }
          
        }
    })

    console.log("printable", printable)

    getFailedSkippedScenarios(printable)
    populateModal(printable);


}

function getFeatureScenarios(task){

    let feat= getTaskValue(task.id)

    titulos.forEach(function(t){
        if (normalize(t.name) == normalize(feat)) {
            task.featName = feat
            task.failScenarios = new Array();
            task.skipScenarios = new Array();
            if (t.failScenarios.length>0){
                t.failScenarios.forEach(s => task.failScenarios.push(s))
            } 
            if(t.skipScenarios.length>0){
                t.skipScenarios.forEach(s => task.skipScenarios.push(s))
            }
            
            
        }
    });
    
}

function getFailedSkippedScenarios(printable){
    printable.forEach(print =>{
        print.tasks.forEach(task =>{
            getFeatureScenarios(task)




        })
    })
}
function populateModal(printable){
    $('.modal-sequence .modal-body').html("")

    var i = 1;
    printable.forEach(print=>{
        let combinedArray = print.goals.concat(print.tasks)
        let resultstring = "";
        combinedArray.forEach(element =>{
            if(element.green){
                resultstring = resultstring +"<span style='color:#2b6d24;'>"+ element.name + "</span><br>"

            }
            else{
                resultstring = resultstring +"<span style='color:#8c2026;'>"+ element.name + "</span><br>"
            }
        })
        let scenarios = new Array();
        print.tasks.forEach(t=>{
            if(t.failScenarios){
                t.failScenarios.forEach(f => scenarios.push(f))
            }
            if(t.skipScenarios){
                t.skipScenarios.forEach(ts => scenarios.push(ts))
            }
           

        })
        $('.modal-sequence .modal-body').append('<p> <b>'+ i + '</b>: '+resultstring+'</p>')
        let filename = "scenariosIteration"+i;
        scenarios = arrayScenarios.push(scenarios)
        $('.modal-sequence .modal-body').append('<div><button onclick="downloadScenario('+i+')">Baixar Informação de Cenários</button></div>')

        i++;

    })
    $('.modal-sequence').modal('show');
}

function downloadScenario(index){
    debugger
    let i = index-1;
    let scenarios = arrayScenarios[i];
    console.log("oi")
    let text= ""
    scenarios.forEach(s => text = text + JSON.stringify(s) + "\n")
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', 'scenariosSeq'+index+".txt");
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    // document.body.removeChild(element);

    
}


function doesIncludesId(id, goal){
    let c = goal.children.find(child => child.id == id)
    
    if(!c) return false;
    return true;

}

function naturalCompare(a,b){
    //reference
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare
    return a.name.localeCompare(b.name, 'en', {numeric: true, ignorePunctuation: true})

}


function pathDFD2(goal, paths, visited, queue, i){
    queue.push(goal);
    visited.push(goal.id)

    if(!goal.children){//se for folha

        if(!paths[i.number]){
            paths[i]=[]
        }
        let aux = [];
        queue.forEach(q => aux.push(q));
        paths.push(aux)
        i.number++
        queue.pop();
        return;

    }
    //Natural sort pra organizar os filhos
    goal.children.sort(naturalCompare)


    //Verificar se tem notação
    //let reg = /\[DM\(/;
    let reg = /(\((G|T)[1-9]+\#)/ 
    let dm = findRegex(reg, goal.name);
    if(dm!=null){
        decisionAnotation(goal, dm);

    }


     let linkarray=[];
     isOrRefinement(goal, linkarray);
     if(linkarray.length>0){//if is type OR
        let child = getHighestPriorityNode(goal.children);
        child.green = false;

        pathDFD2(child, paths, visited, queue, i)

        queue.pop();//substituir num futuro proximo
        return;


     }
   
    else{
        goal.children.forEach(child =>{
            if(child.type == 'Goal'){
                result= getFactorValue(child.id, "RESULT")
                if(result=="Negativo"){
                    result = false;
                }
                else{
                    result=true;
                }
    
            }
            if(child.type=='Task'){
                result = getTaskResult(child.id);
                result = getResult(result);
                child.result = result;

                let dependency = getFactorValue(child.id, "dependency");
                if(dependency!=undefined){
                    let linesD = dependency.split('\n');
                    linesD.forEach(line=>{
                        if(!checkDependency(line)) result = false;                       

                    })
                }
    
            }
            if(result){
                // visited.push(child.id)
                child.green = true
            }
            else{
                child.green = false
                
            }
            pathDFD2(child, paths, visited, queue, i)

        } )
    
    }

    //verify if visited
    let c =goal.children.filter(child => !visited.includes(child.id))
    if(c.length == 0){
        queue.pop();
        return;

    }
}
function findDependencyOnList(reg, word, added=true){
    let adition = 2;
    if(!added){
        adition = 1;
        
    }
    let pos = word.search(reg) 
            let variable = word.substring(0, pos).trim();
            let varResult = word.substring(pos+adition).trim();
            let dependency ={}
            dependency = dependencies.find(dependency =>{
                if(dependency.variable == variable) return true;
                
            })

            let object = {}
            object.varResult = varResult;
            object.variable = variable;
            object.listDependency = dependency

            return object;


}
function checkDependency(dep){
    

  
        if(dep.includes('==')){
            // let pos = dep.search(/\=\=/) 
            // let variable = dep.substring(0, pos).trim();
            // let varResult = dep.substring(pos+2).trim();
            // let dependency ={}
            // dependency = dependencies.find(dependency =>{
            //     if(dependency.variable == variable) return true;
                
            // })
            let dependencyObj = findDependencyOnList(/\=\=/, dep)

            if(!dependencyObj.listDependency){
                return false
            }
            let listDependency = dependencyObj.listDependency
            let varResult = dependencyObj.varResult;
            if(listDependency.operator==='='){
                if(listDependency.result === varResult){
                    return true
                }
              
            }
            return false;
            
        }

        else if(dep.includes('!=')){

            let dependencyObj = findDependencyOnList(/\!\=/, dep)
            if(!dependencyObj.listDependency){
                return false
            }
            let listDependency = dependencyObj.listDependency
            let varResult = dependencyObj.varResult;
            if(listDependency.operator==='!='){
                if(listDependency.result === varResult){
                    return true
                }
              
            }
            else if(listDependency.operator==='='){
                if(listDependency.result != varResult){
                    return true
                }
              
            }
            return false;


        }
        else if(dep.includes('>=')){

            let dependencyObj = findDependencyOnList(/\>\=/, dep)
            if(!dependencyObj.listDependency){
                return false
            }
            let listDependency = dependencyObj.listDependency
            let varResult = dependencyObj.varResult;
            let a = parseFloat(listDependency.result)
            let b = parseFloat(varResult)
            if(listDependency.operator==='>'){
                if(listDependency.result === varResult){
                    return true
                }
                if(a>b){
                    return true;
                }
              
            }
            if(listDependency.operator==='='){
                if(a >= b){
                    return true
                }
              
            }
            return false;


        }
        else if(dep.includes('<=')){
            let dependencyObj = findDependencyOnList(/\<\=/, dep)
            if(!dependencyObj.listDependency){
                return false
            }
            let listDependency = dependencyObj.listDependency
            let varResult = dependencyObj.varResult;
            let a = parseFloat(listDependency.result)
            let b = parseFloat(varResult)
            if(listDependency.operator==='<'){
                if(listDependency.result === varResult){
                    return true
                }
                if(a<b){
                    return true;
                }
              
            }
            if(listDependency.operator==='='){
                if(a <= b){
                    return true
                }
              
            }
            return false;

        }
        else if(dep.includes('>')){

            let dependencyObj = findDependencyOnList(/\>/, dep, false)
            if(!dependencyObj.listDependency){
                return false
            }
            let listDependency = dependencyObj.listDependency
            let varResult = dependencyObj.varResult;
            let a = parseFloat(listDependency.result)
            let b = parseFloat(varResult)
            if(listDependency.operator==='>'){
                if(listDependency.result === varResult){
                    return true
                }
                if(a>b){
                    return true;
                }
              
            }
            if(listDependency.operator==='='){
                if(a > b){
                    return true
                }
              
            }
            return false;
            

        }
        else if(dep.includes('<')){

            let dependencyObj = findDependencyOnList(/\>/, dep, false)
            if(!dependencyObj.listDependency){
                return false
            }
            let listDependency = dependencyObj.listDependency
            let varResult = dependencyObj.varResult;
            let a = parseFloat(listDependency.result)
            let b = parseFloat(varResult)
            if(listDependency.operator==='<'){
                if(listDependency.result === varResult){
                    return true
                }
                if(a<b){
                    return true;
                }
              
            }
            if(listDependency.operator==='='){
                if(a < b){
                    return true
                }
              
            }
            return false;
            

        }
   
                    
}



function getHighestPriorityNode(children){
    let result = null;
    let resultPriority = 0;
    children.forEach(child =>{
        childPrio= getFactorValue(child.id, "priority")
        if(childPrio>resultPriority){
            resultPriority = childPrio
            result = child;
        }
    })

    return result;
}

function decisionAnotation(goal, word){

    let begin = word.search(/\(/)
    let end = word.search(/\)/)
   
    let options = word.substring((begin+1), (end)).replace(/ /g, '')
    // let stringarray = options.split(",")
    let stringarray = options.split("#")

    goal.children.forEach(child =>{
        let indexName = child.name.search(/\:/)
        let namechild = child.name.substring(0, indexName);
        if(stringarray.includes(namechild)){
            child.unordered = true;
        }else{
            child.unordered = false;
        }
    })

    goal.children.sort(prioritySort);



    

}

function prioritySort(a, b){

    if(a.unordered && b.unordered){
        let aPri = getFactorValue(a.id, "priority");
        let bPri = getFactorValue(b.id, "priority");
        if(aPri>bPri){
            return -1
        }
        else if(aPri<bPri){
            return 1
        }
        else return 0;



    }else{
        return 0;
    }

}





function prioritizeAutomatically(){
    let iconOptions = [null, null, null];

    var options = {
        criteria: 'priority',
        value: true,
        coloring: false,
        resize: false,
    };
    iconOptions[0] = options;


    prioritizationPlugin.showAttributeIcon(iconOptions, true);


}

function showAttributeIcon(options) {
    var t0 = performance.now();
    _.each(istar.graph.getElements(), function (element, onlyTasks = false) {
        if (element.isNode()) {
            //addAttributeIcon(element, 'Priority', -25, options);
            if(onlyTasks){
            }

            if (options[0]) {
                addAttributeIcon(element, options[0].criteria, -50, options[0]);
            }
            if (options[1]) {
                addAttributeIcon(element, options[1].criteria, -25, options[1]);
            }
            if (options[2]) {
                addAttributeIcon(element, options[2].criteria, 0, options[2]);
            }
        }
    });
    var t1 = performance.now();
}

function getChildrenGoals(goal){//guarantees that each goal in allGoals has their children
    if(goal.type == 'Goal'){
        let actualGoal =  allGoals.find(g =>{
            if(g.id == goal.id) return g;
        })
    
        actualGoal.children = goal.children;
    
        for (let i = 0; i < goal.children.length; i++){
            let c  = goal.children[i];
            getChildrenGoals(c);
        }

    }

}

function findRegex(reg, name){

    let wordInd = name.search(reg)

    if(wordInd===(-1)){
        return null
    }
    let result = name.substr(wordInd);


    return result
    //depois de achar a regex, classificar de acordo com a prioridade
    // se algum dos filhos não participar da regex a posição dele permanece a mesma

}



function calculateWeighted(costA, riskA, valueA, penaltyW, benefitW, costW, riskW){
    tasks.forEach(function (t){
        if(!t.priority) t.priority = 0;
        let benefit = getFactorValue(t.id, "benefit");
        let penalty = getFactorValue(t.id, "penalty");
        let cost = getFactorValue(t.id, "cost");
        let risk = getFactorValue(t.id, "risk");
        

        t.tValue = ((benefit*benefitW) + (penalty *penaltyW)).toFixed(2)
        t.Wcost = (cost * costW).toFixed(2);
        t.Wrisk = (risk * riskW).toFixed(2);
        valueA.push(t.tValue);
        costA.push(t.Wcost)
        riskA.push(t.Wrisk);
        createPropertiesTask(t.id, t.tValue, "totalValue")
        createPropertiesTask(t.id, t.Wcost, "weightedCost")
        createPropertiesTask(t.id, t.Wrisk, "weightedRisk")        

    })

}

function sumArray(arrayName){
    let result  = arrayName.reduce((previous, current)=>{
        if(Number.isNaN(current)){
            current = 0;
        }
        return parseFloat(previous) + parseFloat(current);

    }, 0)

    return result
}

function calculatePercentage(value, total){
    return ((value/total)*100)
}

function calculateTaskProperties(penaltyW, benefitW, costW, riskW){
    let costArray = [];
    let riskArray = [];
    let valueArray = [];
    calculateWeighted(costArray, riskArray, valueArray, penaltyW, benefitW, costW, riskW);
    let totalCost = sumArray(costArray);
    let totalRisk = sumArray(riskArray);
    let totalValue = sumArray(valueArray);
    tasks.forEach(function (t){
        t.pValue = calculatePercentage(t.tValue, totalValue);
        t.pCost = calculatePercentage(t.Wcost,totalCost);
        t.pRisk = calculatePercentage(t.Wrisk,totalRisk);
       
        let priority = (t.pValue / ((t.pCost * costW) + (t.pRisk * riskW))).toFixed(2);
        t.priority = priority;

        createPropertiesTask(t.id, priority, "priority")
        // createPropertiesTask(t.id, t.pValue, "ValueP")
        // createPropertiesTask(t.id, t.pCost, "CostP")
        // createPropertiesTask(t.id, t.pRisk, "RiskP")



    })
}

function calculateTaskSumCoverage(goal, sum, numLinks){
    if(goal.type == 'Goal'){
        let priority = getFactorValue(goal.id, "priority");
        sum = sum + parseFloat(priority);
        numLinks = numLinks+1;
    }
        
    for (let i = 0; i < goal.children.length; i++) {
	
        let c = goal.children[i];
        
            if (c.type == 'Goal') {
                result = calculateTaskSumCoverage(c, sum, numLinks);
            } else {

                //if task tiver filhos ela nao tera bdd
                tasks.forEach(function(t){
                    if(c.id == t.id){
                        if(!t.sum) t.sum = 0;
                        t.sum = t.sum + sum;
                        if(!t.coverage) t.coverage = 0;
                        t.coverage = t.coverage + numLinks;

                        if(t.children.length>0){
                            c.children = t.children;
                            sum = sum + task.sum;
                            calculateTaskSumCoverage(c, sum, numLinks);
                        }
                    }
                })
    
        }

        
    }
    return;
}



function createPropertiesTask(taskId, propvalue, propname){
    var node = istar.getCellById(taskId);
    var keys = Object.keys(node.attributes.customProperties);
   
     ui.changeCustomPropertyValue(istar.getCellById(taskId), propname, propvalue);


}


function getFactorValue(nodeId, factor){

    var node = istar.getCellById(nodeId);
    var keys = Object.keys(node.attributes.customProperties);

    var value = '';

    value = node.attributes.customProperties[factor];
    return value;
}




function isOrRefinement(goal, linkarray){
    var currentLinksFromSource = istar.graph.getConnectedLinks(goal);
    _.forEach(currentLinksFromSource, function (link) {
        if(link.attributes.type =="OrRefinementLink"){
            linkarray.push(link);
        }


    });

}


function isExequivel(goal) {
    var result = false;
    goal.result = null;
    
    for (let i = 0; i < goal.children.length; i++) {
	
    let c = goal.children[i];
	
        if (c.type == 'Goal') {
            result = isExequivel(c);
        } else {
            let childTask = false;
            //if task tiver filhos ela nao tera bdd
            tasks.forEach(function(t){
                if(c.id === t.id){
                    if(t.children.length>0){
                        c.children = t.children;
                        childTask = true;
                        isExequivel(c);
                    }
                }
            })
	    var result = 'PENDING';
            if(childTask){
                result = c.result;
            }
            else{
                var value = c.name;
                result = getTaskResult(c.id);
                    
                    ui.changeColorElement(getColour(result), istar.getCellById(c.id));
                    
                    result = getResult(result);

            }

    }
    let linkarray=[]

    isOrRefinement(goal, linkarray);
    if(linkarray.length>0){
        if(goal.result==null){
            //At OR if goal.result = null it needes to receive the first task result
            goal.result = result
        }
        goal.result = goal.result || result;
    }
    else{//AND
        if(goal.result == null){
            //at AND when it is null it needes to be considered true to apply AND logic
            goal.result = true;
        }
        goal.result = goal.result && result;

    }
    
        ui.changeCustomPropertyValue(istar.getCellById(goal.id), 'RESULT', goal.result ? 'Positivo' : 'Negativo');
    }
    ui.changeColorElement(goalColours[goal.result], istar.getCellById(goal.id));
    return goal.result;
}

function getResult(result) {
    switch(result) {
	case 'SUCCESS':
	    result = true;
	    break;
	case 'FAILURE':
	    result = false;
	    break;
	case 'SKIPPED':
	    result = false;
	    break;
	case 'PENDING':
	    result = false;
	    break;
	default:
	    result = false;
	    break;
    }
    
    return result;
}

function getTaskResult(nodeId) {
    
    var value = getTaskValue(nodeId);
    var result = 'PENDING';
    
    titulos.forEach(function(t){
        if (normalize(t.name) == normalize(value)) {
           
            result = t.result;
            return result;
        }
    });
    
    return result;
}

function getTaskValue(nodeId) {
    
    //"121a9626-5a8f-4ecf-85a4-41aec411cc94"
    
    var node = istar.getCellById(nodeId);
    var keys = Object.keys(node.attributes.customProperties);

    var value = '';

    if (keys.length > 1) {
        try {
            // value = normalize(node.attributes.customProperties[keys[1]]);
            value = normalize(node.attributes.customProperties.feature);
        } catch (e) {
        }
    }else{
    }
        
    return value;
} 

function readTree() {
    
    goals = [];
    
    model = JSON.parse(istar.fileManager.saveModel());
    
    links = model.links;
    
    _.map(istar.getElements(), function(node) { 
        if (node.attributes.type == 'Goal') {
            goals.push({
                id: node.attributes.id,
                name: node.attributes.name,
                type: node.attributes.type,
            });
        }
    });
    
    goals.forEach(function(g) {
        g.children = getGoalChildren(g);
    });
    //tasks
    _.map(istar.getElements(), function(node) { 
        if (node.attributes.type == 'Task') {
            tasks.push({
                id: node.attributes.id,
                name: node.attributes.name,
                type: node.attributes.type,
                sum: 0.0,
                coverage: 0.0
            });
        }
    });

    tasks.forEach(function(t) {
        t.children = getGoalChildren(t);
    });
    let lastSize = goals.length;
    let allGoals = JSON.parse(JSON.stringify(goals));
    
    for ( let i = 0; i < goals.length; i++ ) {
        
        let children = goals[i].children;
    
        for ( let j = 0; j < children.length; j++ ) {
            if (children[j].type == 'Goal') {
                goals[i].children[j] = getGoal(children[j].id);
            }
        }
    }
    
    let orphanGoals = [];
    
    for ( let i = 0; i < goals.length; i++ ) {
        let orphan = true;
        links.forEach(function(l){
            if (l.source==goals[i].id) {
                orphan = false;
            }
        });
        
        if (orphan) {
            orphanGoals.push(goals[i]);
        }
    }
    
    goals = orphanGoals;
    //return orphanGoals;
}

function getGoalChildren(goal) {
    let children = [];
    links.forEach(function(l){
        if (l.target==goal.id) {
            children.push(getChild(l.source));
        }
    });
    
    return children;
}

function getGoal(id) {
    for (let i = 0; i < goals.length; i++) {
        if (goals[i].id == id) {
            return goals[i];
        }
    }
}

function getChild(id) {
    let child = null;
    
    _.map(istar.getElements(), function(node) { 
        if (node.attributes.id == id) {
            child = {
                id: node.attributes.id,
                name: node.attributes.name,
                type: node.attributes.type,
                result: 'N/A'
            }
        }
    });
    
    if (child.type == 'Task') {
        titulos.forEach(function(t){
            if ( compareNames(t.name, child.name) ) {
                child.result = t.result;
                return;
            }
        });
    }
    
    return child;
}

istar.getCellById = function(id) {
    
    var cell = null;
    
    istar.getCells().forEach(function(c){
        if (c.id == id) {
            cell = c;
            return;
        }
    });
    
    return cell;
}

// DEBUG ABAIXO

var missing = [];
var tasks = [];
var similar = [];

function diffTasks() {
    
    missing = [];
    similar = [];
        
    _.map(istar.getElements(), function(node) { 
        if (node.attributes.type == 'Task') {
                        
            tasks.push(node.attributes.name);
            
            var miss = true;
            
            titulos.forEach(function(t){
                if ( compareNames(t.name,node.attributes.name) ) {
                    
                    ui.changeCustomPropertyValue(node, 'Tarefa', t.name);
                    
                    miss = false;
                    return;
                }
            });
            
            if (miss) {
                
                var bestSimilarity = null;
                var lastSimilarity = 0.00;
                
                titulos.forEach(function(t) {
                    
                    let newSimilarity = similarity(t.name,node.attributes.name);
                    
                    if (lastSimilarity < newSimilarity) {
                        lastSimilarity = newSimilarity;
                        bestSimilarity = t.name;
                    }
                });
                
                if (lastSimilarity > 0.7) {
                    similar.push({
                        task: node.attributes.name, 
                        similar: bestSimilarity,
                        calc: lastSimilarity,
                    });
                    
                    ui.changeCustomPropertyValue(node, 'Tarefa', bestSimilarity);
                    
                } else {
                    missing.push(node.attributes.name);
                }
            }
        }
    });
    
    missing = missing.sort();
    
    return missing;
}

function resetGoals() {
    _.map(istar.getElements(), function(node) { 
        if (node.attributes.type == 'Goal') {
            ui.changeColorElement('#FFFF00', node);
            ui.changeCustomPropertyValue(node, 'RESULT', null);
        }
    });
}

function showDependencyModal(){
    $('.modal-dependency').modal('show')
}

function getDependencies(text){
    dependencies = []
    var lines = text.split('\n')
    let reg =/\=|\>|\<|\!\=/ ;

    lines.forEach(line=>{
      let pos = line.search(reg)  
      let added = 1;

      if(line.includes('!=')){
        added = 2
      }

      let variable = line.substring(0, pos).trim();
      let operator = line.substr(pos, added);
      let result = line.substring(pos+added).trim();
      let dependency = {}
      dependency.variable = variable
      dependency.operator = operator
      dependency.result = result;
      dependencies.push(dependency)

    })
}


$(document).ready(function () {
    $('#menu-button-examples').parent().append('<a id="menu-button-proccess" class="btn btn-default" onclick="proccessTree();">Verificar Alcançabilidade</a>');
    $('#menu-button-examples').parent().append('<a id="menu-wieger-weights" class="btn btn-default" onclick="showWeightModal();">Modificar Pesos</a>');
    // $('#menu-button-examples').parent().append('<a id="menu-dependency" class="btn btn-default" onclick="showDependencyModal();">Adicionar Dependencia de teste</a>');
    $('#menu-button-examples').parent().append('<a id="menu-calculate-priority" class="btn btn-default" onclick="priorityTree();">Calcular Prioridade</a>');
    $('#menu-button-examples').parent().append('<a id="menu-calculate-sequence" class="btn btn-default" onclick="calculatePath();">Calcular Sequencia de Desenvolvimento</a>');
});
