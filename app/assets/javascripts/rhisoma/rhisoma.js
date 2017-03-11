function Rhisoma(){

	var master = this;
	var json = null;
	var processing_graph = [];
	var entire_graph = {};
	var active_graph = {};
	var groups = {};
	var current_crawl = 0;
	var primary = undefined;
	var communicator = new RhisomaCommunicator();

	var block_node = []; // em caso de collapse false, coloca o nódulo e seus children na lista: checa quando vai criar o active_graph; se estiver bloqueado, não desenhar (só desenhar o parent)
	var check_block = false;
	var apply_standby = [];
	var check_standby = false;

	var update_groups = false;

	var gui = new Gui();

	this.setJSON = function(data){
		json = data;
		entire_graph = {};
		entire_graph.nodes = json.nodes; // referência do gráfico completo [substitui json como ref para o programa]
		entire_graph.links = json.links;
		for(var i = 0; i < json.groups.length; i++){
			groups[json.groups[i].id] = {};
			groups[json.groups[i].id].color = json.groups[i].color;
			groups[json.groups[i].id].name = json.groups[i].name;
		}
		for(var i = 0; i < entire_graph.nodes.length; i++){
			if(groups[entire_graph.nodes[i].group] != undefined){
				entire_graph.nodes[i].color = groups[entire_graph.nodes[i].group].color;
			}
			else{
				entire_graph.nodes[i].color = "#000000";
			}
		}
		active_graph.nodes = [];
		active_graph.links = [];
		master.initialize();
		// inicialização
		// processa o graph para poder desenhar a interface
		// seleciona o modo que mostra o dia atual
				// CRIAR interface simples para seleção do período a ser mostrado no graph (default = hoje)
	}

	this.getGraph = function(){
		graph = {};
		graph.nodes = [];
		graph.links = [];
		for(var i = 0; i < active_graph.nodes.length; i++){
			graph.nodes[i] = {};
			for (var property in active_graph.nodes[i]) {
			    if (active_graph.nodes[i].hasOwnProperty(property)) {
			        graph.nodes[i][property] = active_graph.nodes[i][property];
			    }
			}
		}
		for(var i = 0; i < active_graph.links.length; i++){
			graph.links[i] = {};
			for (var property in active_graph.links[i]) {
			    if (active_graph.links[i].hasOwnProperty(property)) {
			        graph.links[i][property] = active_graph.links[i][property];
			    }
			}
		}
		return graph;
	}

	this.getGroups = function(){
		return groups;
	}

	this.initialize = function(){
		master.processEntireGraph();			
			// conferir se a data do target é hoje; se sim, marcar em .urgent
			// traçar caminho até a origem e atualizar o .urgent deles
			// espessura é relativa ao número de children do node que são .urgent

			// funções para inicializar graph
			// contabiliza tamanho dos nódulos, cores, espessura das linhas, etc
			// parte ativa (dia atual e pinned[pinned é básico para categorias, pode ser toggled off])

		/* PROCESSA ACTIVE_GRAPH */
		var inc = 0;
		for(var i = 0; i < entire_graph.nodes.length; i++){
			var found_match = false;
			for(var j = 0; j < block_node.length; j++){
				if(entire_graph.nodes[i].id === block_node[j]){
					found_match = true;
				}
			}
			if(!found_match){
				active_graph.nodes[inc] = {};
				for (var property in entire_graph.nodes[i]) {
				    if (entire_graph.nodes[i].hasOwnProperty(property)) {
				        active_graph.nodes[inc][property] = entire_graph.nodes[i][property];
				    }
				}
				inc++;
			}
		}
		inc = 0;
		for(var i = 0; i < entire_graph.links.length; i++){
			var found_match = false;
			for(var j = 0; j < block_node.length; j++){
				if(entire_graph.links[i].source === block_node[j] || entire_graph.links[i].target === block_node[j]){
					found_match = true;
				}
			}
			if(!found_match){
				active_graph.links[inc] = {};
				for (var property in entire_graph.links[i]) {
				    if (entire_graph.links[i].hasOwnProperty(property)) {
				        active_graph.links[inc][property] = entire_graph.links[i][property];
				    }
				}
				inc++;
			}
		}
		master.applyStandby(true);
	}

	this.updateGraph = function(){
		apply_standby = [];
		master.processEntireGraph();	
			// conferir se a data do target é hoje; se sim, marcar em .urgent
			// traçar caminho até a origem e atualizar o .urgent deles
			// espessura é relativa ao número de children do node que são .urgent

			// funções para inicializar graph
			// contabiliza tamanho dos nódulos, cores, espessura das linhas, etc
			// parte ativa (dia atual e pinned[pinned é básico para categorias, pode ser toggled off])

		/* PROCESSA ACTIVE_GRAPH */
		for(var i = 0; i < active_graph.nodes.length; i++){
			var index = null;
			var current_node = null;
			for(var j = 0; j < entire_graph.nodes.length; j++){
				if(entire_graph.nodes[j].id === active_graph.nodes[i].id){
					index = j;
				}
			}
			if(index != null){
				current_node = entire_graph.nodes[index];
			}
			active_graph.nodes[i] = {};
			for (var property in current_node) {
			    if (current_node.hasOwnProperty(property)) {
			        active_graph.nodes[i][property] = current_node[property];
			    }
			}
		}
		master.applyStandby(true);
	}

	this.getTargetGroup = function(selected_node){
		/*
		Descobre e passa o grupo do nódulo alvo
		--- Otimimzar: informação constará no array de nódulos ativos
		*/
		var edge_group = null;
		var index = 0;
		while(edge_group===null){
			if(active_graph.nodes[index] != null && active_graph.nodes[index] != undefined){
				if(active_graph.nodes[index].id === selected_node){
					if(active_graph.nodes[index].standby === 0){
						edge_group = active_graph.nodes[index].group;
					}
					else{
						edge_group = undefined;
					}
				}
			}
			else{
				return null;
				break;
			}
			index++;
		}
		return edge_group;
	}

	this.getTargetColor = function(selected_node){
		/*
		Descobre e passa o grupo do nódulo alvo
		--- Otimimzar: informação constará no array de nódulos ativos
		*/
		var edge_color = null;
		var index = 0;
		while(edge_color===null){
			if(active_graph.nodes[index] != null && active_graph.nodes[index] != undefined){
				if(active_graph.nodes[index].id === selected_node){
					if(active_graph.nodes[index].standby === 0){
						edge_color = active_graph.nodes[index].color;
					}
					else{
						edge_color = undefined;
					}
				}
			}
			else{
				return null;
				break;
			}
			index++;
		}
		return edge_color;
	}

	// this.distanceToPrimary = function(selected_node){
	// 	current_crawl = 0;
	// 	var continue_crawling = true;
	// 	primary = undefined;
	// 	processing_graph = [];
 //    	processing_graph.push(selected_node);
 //    	while((processing_graph.length-current_crawl) > 0){
 //    		if(!continue_crawling){
 //    			// console.log("teste");
 //    			return primary;
 //    		}
 //    		else{
 //    			master.crawlToPrimary(processing_graph);
 //    		}
 //    		current_crawl++;
 //    	}
 //    	// console.log(processing_graph);
 //      	// return processing_graph.length;

	// }

	// this.crawlToPrimary = function(this_nodes){
	// 	// console.log(this_nodes);
	// 	var no_source = 0;
	// 	for(var i = 0; i < json.links.length; i++){
	// 		if(json.links[i].target === this_nodes[current_crawl] && json.links[i].type === 1){
	// 			this_nodes.push(json.links[i].source);
	// 			no_source++;
	// 			// for(var j = 0; j < json.links.length; j++){
	// 			// 	if(json.links[j].target === json.links[i].source && json.links[j].type === 1){
	// 			// 		no_source++;
	// 			// 	}
	// 			// }
	// 		}
	// 		// checar se o source tem ou não um source
	// 	}
	// 	// console.log(no_source);
	// 	if(no_source===0){
	// 		primary = this_nodes[current_crawl];
	// 		continue_crawling = false;
	// 	}
	// }

	this.nodeStructure = function(selected_node){
		current_crawl = 0;
		processing_graph = [];
    	processing_graph.push(selected_node);
    	var index = null;
    	for(var i = 0; i < entire_graph.nodes.length; i++){
    		if(entire_graph.nodes[i].id === selected_node){
    			index = i;
    		}
    	}
    	while((processing_graph.length-current_crawl) > 0){
    		master.crawlNode(processing_graph);
    		current_crawl++;
    	}
    	entire_graph.nodes[index].children = [];
    	if(processing_graph.length > 0){
    		for(var i = 0; i < processing_graph.length; i++){
    			if(check_standby){
    				var match_found = false;
    				for(var j = 0; j < apply_standby.length; j++){
    					if(apply_standby[j] === processing_graph[i]){
    						match_found = true;
    					}
    				}
    				if(!match_found){
    					apply_standby.push(processing_graph[i]);
    				}
    			}
    			if(check_block === true && i > 0){
    					block_node.push(processing_graph[i]);
    			}
    			else{
					entire_graph.nodes[index].children.push(processing_graph[i]);
    			}
	    	}
    	}
    	check_block = false;
    	check_standby = false;
      	return processing_graph.length;
	}

	this.crawlNode = function(this_nodes){
		for(var i = 0; i < entire_graph.links.length; i++){
			// Links of type 1 > dependency
			if(entire_graph.links[i].source === this_nodes[current_crawl] && entire_graph.links[i].type === 1){
				var include = true;
				for(var j = 0; j < this_nodes.length; j++){
					if(entire_graph.links[i].target === this_nodes[j]){
						include = false;
					}
				}
				if(include){
					this_nodes.push(entire_graph.links[i].target);	
				}
			}
			// Links of type 2 <> relation
			else if(entire_graph.links[i].source === this_nodes[current_crawl] && entire_graph.links[i].type === 2){
				var node_exists = false;
				for(var j = 0; j < this_nodes.length; j++){
					if(entire_graph.links[i].target === this_nodes[j]){
						node_exists = true;
					}
				}
				if(!node_exists){
					this_nodes.push(entire_graph.links[i].target);
				}
			}
			else if(entire_graph.links[i].target === this_nodes[current_crawl] && entire_graph.links[i].type === 2){
				var node_exists = false;
				for(var j = 0; j < this_nodes.length; j++){
					if(entire_graph.links[i].source === this_nodes[j]){
						node_exists = true;
					}
				}
				if(!node_exists){
					this_nodes.push(entire_graph.links[i].source);
				}
			}
		}
	}

	this.navigateRhisomaEnter = function(selected_node){ // contracts rhisoma
		var check_free_nodes = [];

		var increment = 0;
		var found_match = false;
		var index = undefined;
		while(!found_match){
			if(entire_graph.nodes[increment].id === selected_node){
				found_match = true;
				index = increment;
			}
			increment++;
		}

			// update active_graph
			// check and pop nodes that are not in the group to be shown
		var splice = [];
		for(var i = 0; i < active_graph.nodes.length; i++){
			var included = false;
			var increment = 0;
			while(!included && increment < entire_graph.nodes[index].children.length){
				if(active_graph.nodes[i].id === entire_graph.nodes[index].children[increment]){
					included = true;
					if(active_graph.nodes[i].collapse === 0){
						check_free_nodes.push(active_graph.nodes[i]);
					}
				}
				increment++;
			}
			if(!included){
				splice[splice.length] = i;
			}
		}
		var sum = 0;
		for(var i = 0; i < splice.length; i++){
			active_graph.nodes.splice(splice[i]-sum,1);
			sum++;
		}
		splice = [];
		var keep = [];
		for(var i = 0; i < active_graph.nodes.length; i++){
			// check and pop links that are not part of the group to be shown
			var included = false;
			var increment = 0;
			for(var j = 0; j < active_graph.links.length; j ++){
				if(active_graph.links[j].source === active_graph.nodes[i].id && active_graph.links[j].type === 1){
					// this is the one we want to keep
					keep[keep.length] = active_graph.links[j];
				}
				else if(active_graph.links[j].type === 2){
					if(active_graph.links[j].source === active_graph.nodes[i].id || active_graph.links[j].target === active_graph.nodes[i].id){
						// this is the one we want to keep
						var match_found = false;
						for(var z = 0; z < keep.length; z++){
							if(keep[z].id === active_graph.links[j].id){
								match_found = true;
							}
						}
						if(!match_found){
							keep[keep.length] = active_graph.links[j];
						}
					}
				}
				else if(active_graph.links[j].type === 3){ // mostra ligação tipo 3 quando os dois nodes estão no grupo a ser mostrado
					if(active_graph.links[j].target === active_graph.nodes[i].id || active_graph.links[j].source === active_graph.nodes[i].id){
						var match_source = false;
						var match_target = false;
						for(var h = 0; h < active_graph.nodes.length; h++){
							if(active_graph.nodes[h].id === active_graph.links[j].source){
								match_source = true;
							}
							if(active_graph.nodes[h].id === active_graph.links[j].target){
								match_target = true;
							}
						}
						if(match_source && match_target){
							var match_found = false;
							for(var z = 0; z < keep.length; z++){
								if(active_graph.links[j].id === keep[z].id){
									match_found = true;
								}
							}
							if(!match_found){	
								keep[keep.length] = active_graph.links[j];
							}
						}
					}
				}
			}
		}
		active_graph.links = [];
		for(var i = 0; i < keep.length; i++){
			active_graph.links[i] = {};
			for (var property in keep[i]) {
			    if (keep[i].hasOwnProperty(property)) {
			        active_graph.links[i][property] = keep[i][property];
			    }
			}
		}

		// node fechado sem conexão com elementos ativos no grafo é conectado ao selected_node
		var inc_link = 0;
		for(var i = 0; i < check_free_nodes.length; i++){
			var match_found = false;
			for(var j = 0; j < active_graph.links.length; j++){
				if(check_free_nodes[i].id === active_graph.links[j].source || check_free_nodes[i].id === active_graph.links[j].target){
					match_found = true;
				}
			}
			if(!match_found){
				var create_link = {"id":"_FILLER_"+inc_link,"type":3,"source":selected_node,"target":check_free_nodes[i].id};
				active_graph.links.push(create_link);
				inc_link++;
			}
		}
	}

	this.navigateRhisomaExitCheck = function(this_node){
		if(this_node != undefined){
			master.navigateRhisomaExit(this_node);
		}
		else{
			master.navigateRoot();
		}
	}

	this.navigateRhisomaExit = function(selected_node){ // expands rhisoma
		var check_free_nodes = [];

		var increment = 0;
		var found_match = false;
		var index = undefined;
		
		while(!found_match && increment < entire_graph.nodes.length){
			if(entire_graph.nodes[increment].id === selected_node){
				found_match = true;
				index = increment;
			}
			increment++;
		}

			// update active_graph
			// check and push nodes that are in the group to be shown
		var include = [];
		for(var i = 0; i < entire_graph.nodes[index].children.length; i++){ // bug children of undefined
			found_match = false;
			increment = 0;
			while(!found_match && increment < active_graph.nodes.length){
				if(active_graph.nodes[increment].id === entire_graph.nodes[index].children[i]){
					found_match = true;
				}
				increment++;
			}
			if(!found_match){
				for(var j = 0; j < block_node.length; j++){
					if(block_node[j] === entire_graph.nodes[index].children[i]){
						found_match = true;
					}
				}
				if(!found_match){
					var free_node_index = master.getNodeIndex(entire_graph.nodes[index].children[i]);
					if(entire_graph.nodes[free_node_index].collapse === 0){		
						check_free_nodes.push(entire_graph.nodes[free_node_index]);
					}
					include[include.length] = entire_graph.nodes[index].children[i];
				}
			}
		}

			// check and push links to be shown
		for(var i = 0; i < include.length; i++){
			found_match = false;
			increment = 0;
			var include_index;
			while(!found_match && increment < entire_graph.nodes.length){
				if(include[i] === entire_graph.nodes[increment].id){
					found_match = true;
					include_index = increment;
				}
				increment++;
			}
			if(found_match){
				var construct_node = {};
				for (var property in entire_graph.nodes[include_index]) {
				    if (entire_graph.nodes[include_index].hasOwnProperty(property)) {
				        construct_node[property] = entire_graph.nodes[include_index][property];
				    }
				}
				active_graph.nodes.push(construct_node);
			}
			
		}
		var links = [];
		for(var i = 0; i < include.length; i++){
			for(var j = 0; j < entire_graph.links.length; j++){
				if(include[i] === entire_graph.links[j].source && entire_graph.links[j].type === 1){
					match_found = false;
					for(var m = 0; m < block_node.length;m++){
						if(entire_graph.links[j].target === block_node[m]){
							match_found = true;
						}
					}
					if(!match_found){
						var current_id = master.getNodeIndex(entire_graph.links[j].source);
						// if(entire_graph.nodes[current_id].collapse != 0){
							links[links.length] = entire_graph.links[j];
						// }
					}
				}
				else if(entire_graph.links[j].type === 2){
					if(include[i] === entire_graph.links[j].source || include[i] === entire_graph.links[j].target){
						match_found = false;
						for(var m = 0; m < block_node.length;m++){
							if(entire_graph.links[j].target === block_node[m]){
								match_found = true;
							}
						}
						if(!match_found){
							var current_id = master.getNodeIndex(entire_graph.links[j].source);
							// if(entire_graph.nodes[current_id].collapse != 0){
								links[links.length] = entire_graph.links[j];
							// }
						}
					}
				}
				else if(entire_graph.links[j].type === 3){
					if(include[i] === entire_graph.links[j].target || include[i] === entire_graph.links[j].source){
						var match_source = false;
						var match_target = false;
						for(var h = 0; h < include.length; h++){
							if(include[h] === entire_graph.links[j].source){
								match_source = true;
							}
							if(include[h] === entire_graph.links[j].target){
								match_target = true;
							}
						}
						for(var h = 0; h < active_graph.nodes.length; h++){
							if(active_graph.nodes[h].id === entire_graph.links[j].source){
								match_source = true;
							}
							if(active_graph.nodes[h].id === entire_graph.links[j].target){
								match_target = true;
							}
						}
						if(match_source && match_target){
							var match_found = false;
							for(var z = 0; z < links.length; z++){
								if(links[z] === entire_graph.links[j]){
									match_found = true;
								}
							}
							if(!match_found){
								links[links.length] = entire_graph.links[j];
							}
						}
					}
				}
			}
		}
		for(var i = 0; i < links.length; i++){
			var construct_link = {};
			for (var property in links[i]) {
			    if (links[i].hasOwnProperty(property)) {
			        construct_link[property] = links[i][property];
			    }
			}
			active_graph.links.push(construct_link);
		}

		// node fechado sem conexão com elementos ativos no grafo é conectado ao selected_node
		var inc_link = 0;
		for(var i = 0; i < check_free_nodes.length; i++){
			var match_found = false;
			for(var j = 0; j < active_graph.links.length; j++){
				if(check_free_nodes[i].id === active_graph.links[j].source || check_free_nodes[i].id === active_graph.links[j].target){
					match_found = true;
				}
			}
			if(!match_found){
				var create_link = {"id":"_FILLER_"+inc_link,"type":3,"source":selected_node,"target":check_free_nodes[i].id};
				active_graph.links.push(create_link);
				inc_link++;
			}
		}

		master.applyStandby(true);
	}

	this.navigateRoot = function(){ // atualizar para ser coerente com collapse
		active_graph = {};
		active_graph.nodes = [];
		active_graph.links = [];
		var inc = 0;
		for(var i = 0; i < entire_graph.nodes.length; i++){
			var found_match = false;
			for(var j = 0; j < block_node.length; j++){
				if(entire_graph.nodes[i].id === block_node[j]){
					found_match = true;
				}
			}
			if(!found_match){
				active_graph.nodes[inc] = {};
				for (var property in entire_graph.nodes[i]) {
				    if (entire_graph.nodes[i].hasOwnProperty(property)) {
				        active_graph.nodes[inc][property] = entire_graph.nodes[i][property];
				    }
				}
				inc++;
			}
		}
		inc = 0;
		for(var i = 0; i < entire_graph.links.length; i++){
			var found_match = false;
			for(var j = 0; j < block_node.length; j++){
				if(entire_graph.links[i].source === block_node[j] || entire_graph.links[i].target === block_node[j]){
					found_match = true;
				}
			}
			if(!found_match){
				active_graph.links[inc] = {};
				for (var property in entire_graph.links[i]) {
				    if (entire_graph.links[i].hasOwnProperty(property)) {
				        active_graph.links[inc][property] = entire_graph.links[i][property];
				    }
				}
				inc++;
			}
		}

		master.applyStandby(true);
	}

	this.updateNodeXY = function(selected_node){
		for(var i = 0; i < active_graph.nodes.length; i++){
			if(active_graph.nodes[i].id === selected_node.id){
				active_graph.nodes[i].x = selected_node.x;
				active_graph.nodes[i].y = selected_node.y;
				active_graph.nodes[i].vx = selected_node.vx;
				active_graph.nodes[i].vy = selected_node.vy;
			}
		}
		for(var i = 0; i < entire_graph.nodes.length; i++){
			if(entire_graph.nodes[i].id === selected_node.id){
				entire_graph.nodes[i].x = selected_node.x;
				entire_graph.nodes[i].y = selected_node.y;
				entire_graph.nodes[i].vx = selected_node.vx;
				entire_graph.nodes[i].vy = selected_node.vy;
			}
		}
	}

	// this.updateLinkXY = function(selected_node){
	// 	for(var i = 0; i < entire_graph.links.length; i++){
	// 		if(entire_graph.links[i].source.id === selected_node.source.id && entire_graph.links[i].target.id === selected_node.target.id){
	// 			entire_graph.links[i].source.x = selected_node.source.x;
	// 			entire_graph.links[i].source.y = selected_node.source.y;
	// 			entire_graph.links[i].source.vx = selected_node.source.vx;
	// 			entire_graph.links[i].source.vy = selected_node.source.vy;
	// 			entire_graph.links[i].target.x = selected_node.target.x;
	// 			entire_graph.links[i].target.y = selected_node.target.y;
	// 			entire_graph.links[i].target.vx = selected_node.target.vx;
	// 			entire_graph.links[i].target.vy = selected_node.target.vy;
	// 		}
	// 	}
	// 	for(var i = 0; i < active_graph.links.length; i++){
	// 		if(active_graph.links[i].source.id === selected_node.source.id && active_graph.links[i].target.id === selected_node.target.id){
	// 			active_graph.links[i].source.x = selected_node.source.x;
	// 			active_graph.links[i].source.y = selected_node.source.y;
	// 			active_graph.links[i].source.vx = selected_node.source.vx;
	// 			active_graph.links[i].source.vy = selected_node.source.vy;
	// 			active_graph.links[i].target.x = selected_node.target.x;
	// 			active_graph.links[i].target.y = selected_node.target.y;
	// 			active_graph.links[i].target.vx = selected_node.target.vx;
	// 			active_graph.links[i].target.vy = selected_node.target.vy;
	// 		}
	// 	}
	// }

	this.addNode = function(fx,fy,callback){
		Converter.addNode(fx,fy,function (new_node) {
			new_node.childConnections = "0";
			new_node.parentConnections = "1";
			new_node.children = [];
			new_node.color = "#000000";
			new_node.size = 1;
			// new_node.fixed = 1;
			entire_graph.nodes.push(new_node);
			active_graph.nodes.push(new_node);
			master.updateGraph();
		    callback(new_node);
		});
	}

	this.addGroup = function(){
		// Converter.addGroup(){function(new_group){
			var new_color = {};
			new_color.color = color(Object.keys(groups).length+1);
			new_color.id = Object.keys(groups).length+1;
			groups[new_color.id] = new_color.color;
			// callback();
			return new_color;
		// }

	}

	this.deleteNode = function(this_node, callback){
		Converter.deleteNode(this_node,function () {
			// update nodes
			var index = undefined;
			for(var i = 0; i < entire_graph.nodes.length; i++){
				if(entire_graph.nodes[i].id === this_node){
					index = i;
				}
			}
			entire_graph.nodes.splice(index,1);

			index = undefined;
			for(var i = 0; i < active_graph.nodes.length; i++){
				if(active_graph.nodes[i].id === this_node){
					index = i;
				}
			}
			active_graph.nodes.splice(index,1);

			// update links
			var sum = 0;
			var splice = [];
			for(var i = 0; i < entire_graph.links.length; i++){
				if(entire_graph.links[i].source === this_node || entire_graph.links[i].target === this_node){
					splice[splice.length] = i;
				}
			}
			for(var i = 0; i < splice.length; i++){
				entire_graph.links.splice(splice[i]-sum,1);
				sum++;
			}

			sum = 0;
			splice = [];
			for(var i = 0; i < active_graph.links.length; i++){
				if(active_graph.links[i].source === this_node || active_graph.links[i].target === this_node){
					splice[splice.length] = i;
				}
			}
			for(var i = 0; i < splice.length; i++){
				active_graph.links.splice(splice[i]-sum,1);
				sum++;
			}
			master.updateGraph();
			callback();
			// quando um node é deletado, os children dele devem ser deletados? ou então: conectar os próximos na cadeia no source do deletado
		});	
	}

	this.deleteNodeChildren = function(this_node){
		// chamar quando for para deletar children {depois de mensagem de confirmação dizendo que serão deletados todos os children do node que está closed}
		// deleta nódulos [pegar nodes[x].children] e links relacionados ao nódulos deletados do entire graph
	}

	this.addLink = function(links, callback){
		var link_match = master.linkExists(links);
		// var link_update = false;
		if(!link_match.exists){
			Converter.addEdge(links,function (edge) {
				var index_target = null;
				var index_source = null;
				var node_to_update = {};
				for(var i = 0; i < entire_graph.nodes.length; i++){
					if(entire_graph.nodes[i].id === links.target){
						index_target = i;
					}
					if(entire_graph.nodes[i].id === links.source){
						index_source = i;
					}
				}
				if(link_match.new_target){
					entire_graph.nodes[index_target].group = entire_graph.nodes[index_source].group;
					entire_graph.nodes[index_target].color = entire_graph.nodes[index_source].color;
					node_to_update.group = entire_graph.nodes[index_source].group;
					node_to_update.color = entire_graph.nodes[index_source].color;
				}
				entire_graph.nodes[index_target].fx = undefined;
				entire_graph.nodes[index_target].fy = undefined;
				// entire_graph.nodes[index_target].fixed = undefined;
				entire_graph.nodes[index_source].fx = undefined;
				entire_graph.nodes[index_source].fy = undefined;
				// entire_graph.nodes[index_source].fixed = undefined;
				node_to_update.fx = "";
				node_to_update.fy = "";

				/*
					TO DO:

					Conferir se fx e fy "" funcionam como undefined no código
				*/

				node_to_update.id = entire_graph.nodes[index_target].id;

				Converter.updateNode(node_to_update,function(){
					var link = {}; // pegar id do BD
					link.source = links.source.toString();
					link.target = links.target.toString();
					link.value = 1;
					link.type = 1;
					link.id = String(edge.id);
					// var link_id = entire_graph.links.length + Math.floor(Math.random() * (900 - 1)) + 1;
					// link.id = link_id.toString(); // pega do back-end
					entire_graph.links.push(link);
					active_graph.links.push(link);	
					master.updateGraph();
					// link_update = true;
					callback();
				});
			});
		}
		else if(link_match.exists && link_match.change_type != undefined && entire_graph.links[link_match.change_type].type != 3){
			links.id = link_match.id;
			links.type = 2;
			Converter.updateEdge(links,function (edge) {
				// conferir
				entire_graph.links[link_match.change_type].type = 2;
				var active_link_index = master.getActiveLinkIndex(entire_graph.links[link_match.change_type].id);
				active_graph.links[active_link_index].type = 2;
				master.updateGraph();
				// link_update = true;
				callback();
			});
		}

		// return link_update;
	}

	this.linkExists = function(links){
		/* Checks if link already exists */
		var link_match = {};
		link_match.new_target = true;
		link_match.new_source = true;
		link_match.exists = false;
		link_match.change_type = undefined;
		for(var i = 0; i < entire_graph.links.length; i++){
			if(entire_graph.links[i].target === links.target && entire_graph.links[i].source === links.source){
				link_match.exists = true;
			}
			else if(entire_graph.links[i].source === links.target && entire_graph.links[i].target === links.source){
				link_match.exists = true;
				link_match.change_type = i;
				link_match.id = entire_graph.links[i].id;
			}
			if(entire_graph.links[i].source === links.target || entire_graph.links[i].target === links.target){
				link_match.new_target = false;
			}
			if(entire_graph.links[i].source === links.source || entire_graph.links[i].target === links.source){
				link_match.new_source = false;
			}
		}
		return link_match;
	}

	this.deleteLink = function(this_link, callback){
		Converter.deleteEdge(this_link, function(){
			for(var i = 0; i < entire_graph.links.length; i++){
				if(entire_graph.links[i].id.toString() === this_link.toString()){
					entire_graph.links.splice(i,1);
				}
			}
			for(var i = 0; i < active_graph.links.length; i++){
				if(active_graph.links[i].id.toString() === this_link.toString()){
					active_graph.links.splice(i,1);
				}
			}
			master.updateGraph();
			callback();
		});
	}

	/* GET */

	this.getNode = function(node){
		var found_match = false;
		var index = 0;
		var this_node = undefined;
		while(!found_match){
			if(node.id === entire_graph.nodes[index].id){
				found_match = true;
			}
			else{
				index++;	
			}
		}
		return entire_graph.nodes[index];
	}

	this.getNodeIndex = function(node_id){
		var found_match = false;
		var index = 0;
		var this_node = undefined;
		while(!found_match && entire_graph.nodes[index] != null){
			if(node_id === entire_graph.nodes[index].id){
				found_match = true;
				this_node = index;
			}
			else{
				index++;	
			}
		}
		return this_node;
	}

	this.getActiveNodeIndex = function(node_id){
		var found_match = false;
		var index = 0;
		var this_node = undefined;
		while(!found_match && active_graph.nodes[index] != null){
			if(node_id === active_graph.nodes[index].id){
				found_match = true;
				this_node = index;
			}
			else{
				index++;	
			}
		}
		return this_node;
	}

	this.getActiveLinkIndex = function(link_id){
		var found_match = false;
		var index = 0;
		var this_link = undefined;
		while(!found_match){
			if(link_id === active_graph.links[index].id){
				found_match = true;
			}
			else{
				index++;	
			}
		}
		return index;
	}

	this.getLinks = function(node){
		var these_links = [];
		var temp_id = undefined;
		for(var i = 0; i < entire_graph.links.length; i++){
			if(entire_graph.links[i].source === node.id || entire_graph.links[i].target === node.id){
				these_links[these_links.length] = {};
				for (var property in entire_graph.links[i]) {
				    if (entire_graph.links[i].hasOwnProperty(property)) {
				        these_links[these_links.length-1][property] = entire_graph.links[i][property];
				    }
				}
			}
		}

		for(var i = 0; i < these_links.length; i++){
			for(var j = 0; j < entire_graph.nodes.length; j++){
				if(these_links[i].source === entire_graph.nodes[j].id){
					temp_id = these_links[i].source;
					these_links[i].source = {};
					these_links[i].source.id = temp_id;
					these_links[i].source.name = entire_graph.nodes[j].name;
				}
				else if(these_links[i].target === entire_graph.nodes[j].id){
					temp_id = these_links[i].target;
					these_links[i].target = {};
					these_links[i].target.id = temp_id;
					these_links[i].target.name = entire_graph.nodes[j].name;
				}
			}
		}
		return these_links;
	}

	// UPDATE NODE & LINKS

	this.updateNode = function(in_node, callback){
		Converter.updateNode(in_node,function () {
			var inc = 0;
			var index = undefined;
			var found_match = false;
			while(!found_match){
				if(entire_graph.nodes[inc].id === in_node.id){
					index = inc;
					found_match = true;
				}
				inc++;
			}
			if(index != undefined){
				for (var property in in_node) {
				    if (in_node.hasOwnProperty(property)) {
				        entire_graph.nodes[index][property] = in_node[property];
				    }
				}
			}

			inc = 0;
			index = undefined;
			found_match = false;
			while(!found_match){
				if(active_graph.nodes[inc].id === in_node.id){
					index = inc;
					found_match = true;
				}
				inc++;
			}
			if(index != undefined){
				for (var property in in_node) {
				    if (in_node.hasOwnProperty(property)) {
				        active_graph.nodes[index][property] = in_node[property];
				    }
				}
			}

			for(var i = 0; i < apply_standby.length; i++){
				if(active_graph.nodes[index].id === apply_standby[i]){
					active_graph.nodes[index].standby = 1;
				}
			}
			callback();
		});
	}

	this.updateLink = function(in_link, callback){
		Converter.updateEdge(in_link, function(){
			var inc = 0;
			var index = undefined;
			var found_match = false;
			while(!found_match){
				if(entire_graph.links[inc].id === in_link.id){
					index = inc;
					found_match = true;
				}
				inc++;
			}
			if(index != undefined){
				for (var property in in_link) {
				    if (in_link.hasOwnProperty(property)) {
				        entire_graph.links[index][property] = in_link[property];
				    }
				}
			}
			inc = 0;
			index = undefined;
			found_match = false;
			while(!found_match){
				if(active_graph.links[inc].id === in_link.id){
					index = inc;
					found_match = true;
				}
				inc++;
			}
			if(index != undefined){
				for (var property in in_link) {
				    if (in_link.hasOwnProperty(property)) {
				        active_graph.links[index][property] = in_link[property];
				    }
				}
			}
			master.updateGraph();
			callback();
		});
	}

	this.collapseNode = function(node, callback){
		var node_object = {};
		node_object.id = node;
		node_object.collapse = 1;
		Converter.updateNode(node_object, function(){
			check_block = false;
			entire_graph.nodes[master.getNodeIndex(node)].collapse = 1;
			active_graph.nodes[master.getActiveNodeIndex(node)].collapse = 1;
			block_node = [];
			master.updateCollapseNodes(node);
			callback();
		});
	}

	this.closeNode = function(node, callback){
		var node_object = {};
		node_object.id = node;
		node_object.collapse = 0;
		Converter.updateNode(node_object, function(){
			check_block = false;
			entire_graph.nodes[master.getNodeIndex(node)].collapse = 0;
			active_graph.nodes[master.getActiveNodeIndex(node)].collapse = 0;
			block_node = [];
			master.updateCloseNodes(node);
			callback();
		});
	}

	this.processEntireGraph = function(){
		for(var i = 0; i < entire_graph.nodes.length; i++){
			if(entire_graph.nodes[i].standby === 1){
				check_standby = true;
			}
			if(entire_graph.nodes[i].collapse === 0){
				check_block = true;
				entire_graph.nodes[i].size = 1;
				master.nodeStructure(entire_graph.nodes[i].id);
			}
			else{
				entire_graph.nodes[i].size = master.nodeStructure(entire_graph.nodes[i].id);
			}
			entire_graph.nodes[i].parentConnections = 0;
			entire_graph.nodes[i].childConnections = 0;
		}
		for(var i = 0; i < entire_graph.links.length; i++){
			if(entire_graph.links[i].type != 3){
				for(var j = 0; j < entire_graph.nodes.length; j++){
					if(entire_graph.links[i].target === entire_graph.nodes[j].id){
						entire_graph.nodes[j].parentConnections++;
					}
					if(entire_graph.links[i].source === entire_graph.nodes[j].id){
						entire_graph.nodes[j].childConnections++;
					}
				}
			}
		}	
	}

	this.updateCloseNodes = function(node){
		var current_children = active_graph.nodes[master.getActiveNodeIndex(node)].children;
		master.processEntireGraph();
		master.updateGraph();
		var index = master.getNodeIndex(node);

		var splice = [];
		for(var i = 0; i < current_children.length; i++){
			if(current_children[i] != node){
				if(master.getActiveNodeIndex(current_children[i])!=undefined){
					active_graph.nodes.splice(master.getActiveNodeIndex(current_children[i]),1);
				}
			}
		}

		var keep = [];
		for(var i = 0; i < active_graph.links.length; i++){
			var source_node_found = false;
			var target_node_found = false;
			for(var j = 0; j < active_graph.nodes.length; j++){
				if(active_graph.links[i].source === active_graph.nodes[j].id){
					source_node_found = true;
				}
				if(active_graph.links[i].target === active_graph.nodes[j].id){
					target_node_found = true;
				}
			}
			if(source_node_found && target_node_found){
				keep[keep.length] = active_graph.links[i];
			}
		}
		active_graph.links = [];
		for(var i = 0; i < keep.length; i++){
			active_graph.links[i] = {};
			for (var property in keep[i]) {
			    if (keep[i].hasOwnProperty(property)) {
			        active_graph.links[i][property] = keep[i][property];
			    }
			}
		}
	}

	this.updateCollapseNodes = function(node){
		master.processEntireGraph();

		var node_index = master.getNodeIndex(node);
		var include = [];
		for(var i = 0; i < entire_graph.nodes[node_index].children.length; i++){
			var process_node_index = master.getNodeIndex(entire_graph.nodes[node_index].children[i]);
			if(entire_graph.nodes[node_index].children[i] != node){
				var found_node_match = false;
				for(var j = 0; j < block_node.length; j++){
					if(entire_graph.nodes[process_node_index].id === block_node[j]){
						found_node_match = true;
					}
				}
				if(!found_node_match){
					include[include.length] = entire_graph.nodes[process_node_index].id;
				}
			}
			else{
				var active_node_index = master.getActiveNodeIndex(entire_graph.nodes[process_node_index].id);
				for (var property in entire_graph.nodes[process_node_index]) {
				    if (entire_graph.nodes[process_node_index].hasOwnProperty(property)) {
				        active_graph.nodes[active_node_index][property] = entire_graph.nodes[process_node_index][property];
				    }
				}
			}
		}	

		for(var i = 0; i < include.length; i++){
			var found_match = false;
			var increment = 0;
			var include_index;
			while(!found_match && increment < entire_graph.nodes.length){
				if(include[i] === entire_graph.nodes[increment].id){
					found_match = true;
					include_index = increment;
				}
				increment++;
			}
			if(found_match){
				var construct_node = {};
				for (var property in entire_graph.nodes[include_index]) {
				    if (entire_graph.nodes[include_index].hasOwnProperty(property)) {
				        construct_node[property] = entire_graph.nodes[include_index][property];
				    }
				}
				active_graph.nodes.push(construct_node);
			}
		}

		var links = [];
		for(var i = 0; i < include.length; i++){
			for(var j = 0; j < entire_graph.links.length; j++){
				if(include[i] === entire_graph.links[j].target && entire_graph.links[j].type === 1){
					match_found = false;
					var node_exists = false;
					for(var m = 0; m < block_node.length;m++){
						if(entire_graph.links[j].target === block_node[m]){
							match_found = true;
						}
					}
					for(var m = 0; m < active_graph.nodes.length; m++){
						if(active_graph.nodes[m].id === entire_graph.links[j].source){
							node_exists = true;
						}
					}
					if(!match_found && node_exists){
						var current_id = master.getNodeIndex(entire_graph.links[j].source);
						links[links.length] = entire_graph.links[j];
					}
				}
				else if(include[i] === entire_graph.links[j].source && entire_graph.links[j].type === 2){
					match_found = false;
					for(var m = 0; m < block_node.length;m++){
						if(entire_graph.links[j].target === block_node[m]){
							match_found = true;
						}
					}
					if(!match_found){
						var current_id = master.getNodeIndex(entire_graph.links[j].source);
						links[links.length] = entire_graph.links[j];
					}
				}
				else if(include[i] === entire_graph.links[j].target && entire_graph.links[j].type === 2){
					match_found = false;
					for(var m = 0; m < block_node.length;m++){
						if(entire_graph.links[j].source === block_node[m]){
							match_found = true;
						}
					}
					if(!match_found){
						var current_id = master.getNodeIndex(entire_graph.links[j].target);
						links[links.length] = entire_graph.links[j];
					}
				}
				else if(entire_graph.links[j].type === 3){ 
					if(include[i] === entire_graph.links[j].target || include[i] === entire_graph.links[j].source){
						var match_source = false;
						var match_target = false;
						for(var h = 0; h < include.length; h++){
							if(include[h] === entire_graph.links[j].source){
								match_source = true;
							}
							if(include[h] === entire_graph.links[j].target){
								match_target = true;
							}
						}
						if(!match_source || !match_target){
							if(match_source && !match_target){
								for(var h = 0; h < active_graph.nodes.length; h++){
									if(active_graph.nodes[h].id === entire_graph.links[j].target){
										match_target = true;
									}
								}
							}
							else if(match_target && !match_source){
								for(var h = 0; h < active_graph.nodes.length; h++){
									if(active_graph.nodes[h].id === entire_graph.links[j].source){
										match_source = true;
									}
								}
							}
						}
						if(match_source && match_target){
							links[links.length] = entire_graph.links[j];
						}
					}
				}
			}
		}
		for(var i = 0; i < links.length; i++){
			var construct_link = {};
			for (var property in links[i]) {
			    if (links[i].hasOwnProperty(property)) {
			        construct_link[property] = links[i][property];
			    }
			}
			active_graph.links.push(construct_link);
		}

		master.applyStandby(true);
	}

	this.applyStandby = function(standby_mode){
		for(var i = 0; i < apply_standby.length; i++){
			var found_match = false;
			var index = undefined;
			var inc = 0;
			while(!found_match){
				if(active_graph.nodes[inc].id === apply_standby[i]){
					found_match = true;
					index = inc;
				}
				else{
					if(active_graph.nodes[inc+1] != null){
						inc++;
					}
					else{
						found_match = true;
					}
				}
			}
			if(index != undefined){
				if(standby_mode){
					active_graph.nodes[index].standby = 1;
				}
				else{
					active_graph.nodes[index].standby = 0;
				}
			}
		}	
	}

	this.toggleNodeStandby = function(node, callback){
		var index = undefined;
		var node_object = {};
		node_object.id = node.id;
		for(var i = 0; i < entire_graph.nodes.length; i++){
			if(entire_graph.nodes[i].id === node.id){
				index = i;
			}
		}
		if(index != undefined){
			if(entire_graph.nodes[index].standby === 0){
				node_object.standby = 1;
			}
			else{
				node_object.standby = 0;
			}
		}
		Converter.updateNode(node_object, function(){
			entire_graph.nodes[index].standby = node_object.standby;
			master.updateGraph();
			callback();
		});
	}

	/* GROUPS */

	this.updateGroups = function(node){
		if(document.getElementById("system-groups-edit") === null){
			var container = {id:"system-message-popup",width:window.innerWidth,height:window.innerHeight,top:0,left:0,backgroundColor:"rgba(255,255,255,0.8)",zindex:0};
			gui.addContainer(container);

			var groups_edit = {id:"system-groups-edit",width:290,height:350,top:(window.innerHeight-370)/2,left:(window.innerWidth-330)/2,backgroundColor:"white",padding:20,border:"1px solid #aeaeae",boxshadow:"-5px 5px rgba(243,243,243,0.6)"};
			gui.addContainer(groups_edit);

			var name_field = {id:"system-groups-edit-name",class:"edit-group"};
			gui.addInput(name_field,"Nome do grupo","system-groups-edit","");

			var color_label = {id:"system-groups-edit-color-label",class:"edit-group",position:"absolute",top:50,left:20,color:"#aeaeae"};
			gui.addField(color_label,"system-groups-edit");
			gui.addText("system-groups-edit-color-label","#");

			var color_field = {id:"system-groups-edit-color",class:"edit-group",width:210,position:"absolute",top:48,left:20,paddingleft:10};
			gui.addInput(color_field,"Cor do grupo","system-groups-edit","000000");

			var preview_field = {id:"system-groups-edit-preview",width:48,height:48,left:260, top:20, backgroundColor:"#000000",border:"1px #aeaeae solid"};
			gui.addField(preview_field,"system-groups-edit");

			var close_button = {id:"system-groups-edit-close",width:164,height:34,top:349,left:-1,border:"1px solid #aeaeae",font:"Font Awesome",fontsize:24,textalign:"center",paddingtop:6,color:"#aeaeae"};
			gui.addField(close_button,"system-groups-edit");
			gui.addText("system-groups-edit-close",'<i class="fa fa-close" aria-hidden="true"></i>');

			var send_button = {id:"system-groups-edit-send",width:165,height:34,top:349,left:164,border:"1px solid #aeaeae",font:"Font Awesome",fontsize:24,textalign:"center",paddingtop:6,color:"#aeaeae"};
			gui.addField(send_button,"system-groups-edit");
			gui.addText("system-groups-edit-send",'<i class="fa fa-check" aria-hidden="true"></i>');

			var selectField = function(){
				this.style.borderBottom = "1px solid #aeaeae";
				this.style.color = "black";
			}
			document.getElementById("system-groups-edit-name").onfocus = selectField;
			document.getElementById("system-groups-edit-color").onfocus = selectField;
		}
		if(node != undefined){
			var process_color = groups[node.group].color.substr(1,groups[node.group].color.length-1);
			document.getElementById("system-groups-edit-name").value = groups[node.group].name;
			document.getElementById("system-groups-edit-color").value = process_color;
			document.getElementById("system-groups-edit-preview").style.backgroundColor = groups[node.group].color;
			$(function() {
			    $('#system-groups-edit-color').colorpicker({
			    	altField: '#system-groups-edit-preview',
					altProperties: 'background-color',
			        parts:  ['map', 'bar'],
			        closeOnOutside: false,
			        color: groups[node.group].color,
			        alpha:  false,
			        autoOpen: true,
			        layout: {
			            map:        [0, 0, 3, 1],
			            bar:        [4, 0, 1, 4]
			        }
			    });
			});
		}
		else{
			$(function() {
			    $('#system-groups-edit-color').colorpicker({
			    	altField: '#system-groups-edit-preview',
					altProperties: 'background-color',
			        parts:  ['map', 'bar'],
			        closeOnOutside: false,
			        color: "#000000",
			        alpha:  false,
			        autoOpen: true,
			        layout: {
			            map:        [0, 0, 3, 1],
			            bar:        [4, 0, 1, 4]
			        }
			    });
			});
		}
		master.systemMessagePopupMouseBehavior();
		master.closeGroupsMouseBehavior();
		master.sendGroupsMouseBehavior(node);
	}

	this.systemMessagePopupMouseBehavior = function(){
		var container = document.getElementById("system-message-popup");
		var mouseOver = function(){
			this.style.cursor = "pointer";
		}
		var mouseOut = function(){
			
		}
		var mouseDown = function(){
			master.removeElement("system-message-popup");
			master.removeElement("system-groups-edit");
			master.removeElementClass("ui-colorpicker");
		}
		container.onmouseover = mouseOver;
		container.onmouseout = mouseOut;
		container.onmousedown = mouseDown;
	}

	this.removeElement = function(element){
		if(document.getElementById(element) != null){
			document.getElementById(element).parentElement.removeChild(document.getElementById(element));
		}
	}

	this.removeElementClass = function(element){
		if(document.getElementsByClassName(element)[0] != null){
			document.getElementsByClassName(element)[0].parentElement.removeChild(document.getElementsByClassName(element)[0]);
		}
	}

	this.closeGroupsMouseBehavior = function(){
		var button = document.getElementById("system-groups-edit-close");
		var mouseOver = function(){
			this.style.cursor = "pointer";
			this.style.color = "black";
		}
		var mouseOut = function(){
			this.style.color = "#aeaeae";
		}
		var mouseDown = function(){
			master.removeElement("system-message-popup");
			master.removeElement("system-groups-edit");
			master.removeElementClass("ui-colorpicker");
		}
		button.onmouseover = mouseOver;
		button.onmouseout = mouseOut;
		button.onmousedown = mouseDown;
	}

	this.sendGroupsMouseBehavior = function(node){
		var button = document.getElementById("system-groups-edit-send");
		var mouseOver = function(){
			this.style.cursor = "pointer";
			this.style.color = "black";
		}
		var mouseOut = function(){
			this.style.color = "#aeaeae";
		}
		var mouseDown = function(){
			var edit_name = document.getElementById("system-groups-edit-name").value;
			var edit_color = document.getElementById("system-groups-edit-color").value;
			var check_update = false;
			if(node != undefined){
				var isOk  = /(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i.test(document.getElementById("system-groups-edit-color").value);
				if(isOk){
					if(edit_name != ""){
						var group_object = {};
						group_object.id = node.group;
						group_object.name = groups[node.group].name;
						group_object.color = groups[node.group].color;
						
						if(edit_name != groups[node.group].name){
							group_object.name = edit_name;
							check_update = true;
						}
						if(edit_color != groups[node.group].color){
							group_object.color = "#"+edit_color;
							check_update = true;
						}
						if(check_update){
							Converter.updateStylingGroup(group_object,function(){
								groups[node.group].name = group_object.name;
								groups[node.group].color = group_object.color;
								update_groups = true;
								master.updateGraphGroups();
								master.eventFire(document.body, 'click');
								master.removeElement("system-message-popup");
								master.removeElement("system-groups-edit");
								master.removeElementClass("ui-colorpicker");
							});
						}
					}
					else{
						var element = document.getElementById("system-groups-edit-name");
						element.style.borderBottom = "1px solid red";
						element.style.color = "red";
					}
				}
				else{
					var element = document.getElementById("system-groups-edit-color");
					element.style.borderBottom = "1px solid red";
					element.style.color = "red";
				}
			}
			else{
				var isOk  = /(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i.test(document.getElementById("system-groups-edit-color").value);
				if(isOk){
					if(edit_name != ""){
						var group_object = {};
						group_object.name = edit_name;
						group_object.color = "#"+edit_color;
						Converter.addStylingGroup(group_object,function(new_group){
							console.log(new_group);
							var element = document.getElementById("system-groups-edit-name");
							element.style.borderBottom = "1px solid #aeaeae";
							// var generate_id = entire_graph.nodes.length + Math.floor(Math.random() * (900 - 1)) + 1;
							// var group_id = generate_id.toString();
							groups[new_group.id] = {};
							groups[new_group.id].name = edit_name;
							groups[new_group.id].color = "#"+edit_color;
							update_groups = true;
							master.eventFire(document.body, 'click');
							master.removeElement("system-message-popup");
							master.removeElement("system-groups-edit");
							master.removeElementClass("ui-colorpicker");
						});
					}
					else{
						var element = document.getElementById("system-groups-edit-name");
						element.style.borderBottom = "1px dashed red";
					}
				}
				else{
					var element = document.getElementById("system-groups-edit-color");
					element.style.borderBottom = "1px dashed red";
				}
			}
		}
		button.onmouseover = mouseOver;
		button.onmouseout = mouseOut;
		button.onmousedown = mouseDown;
	}

	this.updateGraphGroups = function(){
		for(var i = 0; i < entire_graph.nodes.length; i++){
			entire_graph.nodes[i].color = groups[entire_graph.nodes[i].group].color;
		}

		for(var i = 0; i < active_graph.nodes.length; i++){
			active_graph.nodes[i].color = groups[active_graph.nodes[i].group].color;
		}
	}

	this.checkUpdateGroups = function(){
		if(update_groups){
			update_groups = false;
			return true;
		}
		else{
			return update_groups;
		}
	}

	this.eventFire = function(el, etype){
	  if (el.fireEvent) {
	    el.fireEvent('on' + etype);
	  } else {
	    var evObj = document.createEvent('Events');
	    evObj.initEvent(etype, true, false);
	    el.dispatchEvent(evObj);
	  }
	}

	this.getPeriod = function(){
		var period = {};
		period["start"] = null;
		period["end"] = null; 
		for(var i = 0; i < entire_graph.nodes.length; i++){
			// se start não estiver definido: pega date_added
			// se end não estiver definido: ignora
			// aplicar somente com tasks? todos os outros nodes devem ser mostrados?

			if(entire_graph.nodes[i].date_start != "" && period.start === null){
				period.start = entire_graph.nodes[i].date_start;
			}
			if(entire_graph.nodes[i].date_end != "" && period.end === null){
				period.end = entire_graph.nodes[i].date_end;
			}

			if(entire_graph.nodes[i].date_start != "" && moment(period.start).isAfter(moment(entire_graph.nodes[i].date_start))){
				period.start = entire_graph.nodes[i].date_start;
			}
			if(entire_graph.nodes[i].date_end != "" && moment(period.end).isBefore(moment(entire_graph.nodes[i].date_end))){
				period.end = entire_graph.nodes[i].date_end;
			}
		}
		var a = moment(period.end);
		var b = moment(period.start);
		var dif = a.diff(b, 'days') // 1
		// console.log(dif);
		// console.log(period);
	}

}