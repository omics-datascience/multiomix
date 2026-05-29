export default {
    // Common actions
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.stop': 'Detener',
    'common.save': 'Guardar',
    'common.close': 'Cerrar',
    'common.actions': 'Acciones',
    'common.confirm': 'Confirmar',
    'common.sample': 'Muestra',
    'common.goBack': 'Volver',
    'common.search': 'Buscar',
    'common.details': 'Detalles',
    'common.noDetails': 'No se encontraron detalles',
    'common.name': 'Nombre',
    'common.description': 'Descripción',
    'common.requiredField': 'Campo obligatorio',
    'common.model': 'Modelo:',
    'common.date': 'Fecha',
    'common.datasets': 'Conjuntos de datos',
    // Common Labels
    'common.algorithm': 'Algoritmo',
    'common.nClusters': 'Número de clusters',
    'common.metric': 'Métrica',
    'common.scoringMethod': 'Método de puntuación',
    'common.randomState': 'Estado aleatorio',
    'common.penalizer': 'Penalizador',
    'common.integerPlaceholder': 'Un número entero',
    'common.numberOfIterations': 'Número de iteraciones',
    'common.coefficient': 'Coeficiente',
    // Forms and steps
    'common.basicData': 'Datos básicos',
    'common.descriptionOptional': 'Descripción (opcional)',
    'common.continue': 'Continuar',
    // common Tables and states
    'common.state': 'Estado',
    'common.cluster': 'Cluster',
    'common.relations': 'Relaciones',

    // Auth/usuario
    'auth.login': 'Iniciar sesión',
    'auth.greeting': 'Hola, {username}',
    'auth.editProfile': 'Editar perfil',
    'auth.logout': 'Salir',

    // Menús
    'menu.analysis': 'Análisis',
    'menu.gem': 'GEM',
    'menu.gem.tooltip': 'Modulación de Expresión Génica',
    'menu.biomarkers': 'Biomarcadores',
    'menu.datasets': 'Conjuntos de datos',
    'menu.multiomix': 'Multiomix',
    'menu.cbioportal': 'cBioPortal',
    'menu.institutions': 'Instituciones',
    'menu.admin': 'Administración',
    'menu.admin.genes': 'Base de datos: Genes',
    'menu.about': 'Sobre nosotros',
    'menu.faq': 'Preguntas frecuentes',
    'menu.opensource': 'Código abierto',

    // About us
    'about.description': 'Multiomix es el resultado del trabajo interdisciplinario entre miembros de las siguientes instituciones científicas:',
    'about.institution.caeti': 'CAETI - Universidad Abierta Interamericana',
    'about.institution.ciniba': 'CINIBA - Facultad de Ciencias Médicas - UNLP',
    'about.institution.lidi': 'LIDI - Facultad de Informática - UNLP',

    'about.coordination': 'Coordinación del proyecto:',

    'about.members.title': 'Miembros del proyecto:',
    'about.members.main': 'Contribuyente principal:',
    'about.members.collaborators': 'Colaboradores:',

    'about.contact.title': 'Contacto:',
    'about.contact.questions': 'Para preguntas o sugerencias, contáctenos:',
    'about.contact.institutions': 'También puede contactarnos para crear su institución de investigación. Esto permitirá a los investigadores compartir conjuntos de datos dentro de Multiomix.',

    // BIOMARKERS

    // BiomarkerInferenceExperimentsPanel.tsx
    'inference.experiment.title': 'Experimento de interferencia "{name}"',
    // 2.InferenceExperimentClinicalAttributeSelect.tsx
    'inference.clinicalAttribute.label': 'Agrupar por atributo clínico',
    'inference.clinicalAttribute.placeholder': 'Atributo clínico para agrupar',
    // 3.InferenceExperimentResultMetrics.tsx
    'inference.metrics.title': 'Métricas de "{name}"',
    'inference.model': 'Modelo',
    // 5.InferenceExperimentsTable.tsx
    'inference.stop.title': 'Detener experimento de inferencia',
    'inference.stop.confirm': '¿Estás segura de que quieres detener el experimento de inferencia "{name}"?',
    'inference.stop.cancel': '{common.cancel}',
    'inference.stop.button': '{common.stop}',

    'inference.delete.title': 'Eliminar experimento',
    'inference.delete.confirm': '¿Estás segura de que quieres eliminar el experimento de inferencia "{name}"?',
    'inference.delete.cancel': '{common.cancel}',
    'inference.delete.button': '{common.delete}',

    'inference.table.title': 'Experimentos de inferencia',
    'inference.table.columns.model': 'Modelo',
    'inference.table.columns.dataset': 'Conjuntos de datos',
    'inference.table.columns.actions': 'Acciones',

    'inference.search.placeholder': 'Buscar por nombre o descripción',

    'inference.new.title': 'Nuevo experimento de inferencia',
    'inference.results.title': 'Ver resultados',
    'inference.results.tooltip': 'Eliminar experimento',
    // 6.NewInferenceExperimentModal.tsx
    'inference.newInference.title': 'Crear nuevo experimento de inferencia',
    'inference.new.step1': 'Paso 1: Modelo entrenado',
    'inference.new.step2': 'Paso 2: Conjuntos de datos de moléculas',
    // 7.SamplesAndGroupsInferenceTable.tsx
    'inference.table.download.tooltip': 'Descargar resultados en un archivo CSV',
    'inference.table.filter.cluster.placeholder': 'Filtrar por grupo',
    'inference.table.addClusterLabels': 'Agregar etiquetas de grupo',
    // 8.SamplesAndTimeInferenceCharts.tsx
    'inference.charts.noAttribute': 'No se seleccionó ningún atributo clínico',
    'inference.charts.selectAttribute': 'Por favor, selecciona uno en el selector de la derecha.',
    // 9.SamplesAndTimeInferenceTable.tsx
    'inference.timeTable.columns.predictedTime': 'Tiempo predicho',
    'inference.timeTable.filter.range.label': 'Rango',
    'inference.timeTable.filter.range.placeholder': 'Filtrar por rango',
    'inference.timeTable.menu.table': 'Tabla',
    'inference.timeTable.menu.charts': 'Gráficos',
    'inference.timeTable.menu.table.info': 'Tabla con todas las muestras y su tiempo de riesgo/supervivencia predicho',
    'inference.timeTable.menu.charts.info': 'Muestra gráficos con las muestras y su tiempo de riesgo/supervivencia predicho agrupado por alguna condición',
    'inference.timeTable.addRangeLabels': 'Agregar etiquetas de rango',
    // 10.molecules/GeneOntologyCytoscapeChart.tsx
    'geneOntology.form.ontologyType': 'Tipo de ontología',
    'geneOntology.form.generalDepth': 'Profundidad general',
    'geneOntology.form.hierarchicalDepth': 'Profundidad jerárquica hacia hijos',
    'geneOntology.form.toRoot': 'Hasta la raíz',
    'geneOntology.relation.hasPart': 'Tiene parte',
    'geneOntology.relation.isA': 'Es un',
    'geneOntology.relation.partOf': 'Parte de',
    'geneOntology.relation.regulates': 'Regula',
    // 11.GeneOntologyPanel
    'geneOntology.panel.filterType': 'Tipo de filtro',
    'geneOntology.panel.filterType.intersection': 'Intersección',
    'geneOntology.panel.filterType.union': 'Unión',
    'geneOntology.panel.filterType.enrichment': 'Enriquecimiento',
    'geneOntology.panel.pValueThreshold': 'Umbral de valor p',
    'geneOntology.panel.correctionMethod': 'Método de corrección',
    'geneOntology.panel.correctionMethod.analytical': 'Analítico',
    'geneOntology.panel.correctionMethod.bonferroni': 'Bonferroni',
    'geneOntology.panel.correctionMethod.falseDiscoveryRate': 'Tasa de descubrimiento falso',
    'geneOntology.panel.relationType': 'Tipo de relación',
    'geneOntology.panel.relationType.enables': 'Habilita',
    'geneOntology.panel.relationType.involvedIn': 'Involucrado en',
    'geneOntology.panel.relationType.partOf': 'Parte de',
    'geneOntology.panel.relationType.locatedIn': 'Ubicado en',
    'geneOntology.panel.ontologyType': 'Tipo de ontología',
    'geneOntology.panel.ontologyType.biologicalProcess': 'Proceso biológico',
    'geneOntology.panel.ontologyType.molecularFunction': 'Función molecular',
    'geneOntology.panel.ontologyType.cellularComponent': 'Componente celular',
    'geneOntology.panel.table.term': 'Término',
    'geneOntology.panel.table.ontologyType': 'Tipo de ontología',
    // 12GENES.ActionableCancerGenesPanel.tsx
    'actionableGenes.panel.title': 'Panel de genes de cáncer accionables',
    // 13.GeneAssociationsNetworkPanel
    'geneAssociations.relation.fusion': 'Fusión',
    'geneAssociations.relation.coOccurrence': 'Co-ocurrencia',
    'geneAssociations.relation.experimental': 'Experimental',
    'geneAssociations.relation.textMining': 'Minería de texto',
    'geneAssociations.relation.database': 'Base de datos',
    'geneAssociations.relation.coExpression': 'Co-expresión',
    'geneAssociations.form.minCombinedScore': 'Puntuación combinada mínima',
    'geneAssociations.infoPopup.text': 'La puntuación combinada se calcula combinando las probabilidades de los diferentes canales de evidencia y se corrige por la probabilidad de observar una interacción al azar. Para una descripción más detallada consulte von Mering, et al. Nucleic Acids Res. 2005',
    // 14.GeneInformation
    'geneInformation.context.gene': 'para este gen',
    'geneInformation.summary': 'Resumen',
    // 15.MetabolicPathwaysPanel.tsx
    'metabolicPathways.infoPopup': 'Lista de genes que participan en una vía para una base de datos dada',
    'metabolicPathways.header': 'Vías metabólicas',
    'metabolicPathways.selectSource': 'Selecciona una fuente',
    'metabolicPathways.sourcePlaceholder': 'Fuente',
    // 16.PathwaysInformation.tsx
    'pathwaysInformation.context.gene': 'para este gen',
    'pathwaysInformation.context.pathways': 'para este gen',
    // 17.MethylationInformation.tsx
    'methylationInformation.noDetails': 'No se encontraron detalles para este sitio de metilación',
    'methylationInformation.infoPopup.aliases': 'Alias de metilación y posición cromosómica',
    'methylationInformation.header': 'Información de metilación',
    'methylationInformation.chromosomePosition': 'Posición cromosómica:',
    'methylationInformation.infoPopup.ucsc': 'Lista de islas relacionadas con el sitio de metilación según la base de datos UCSC',
    'methylationInformation.header.ucsc': 'Islas CpG UCSC',
    'methylationInformation.table.cpgIsland': 'Isla CpG',
    'methylationInformation.table.relation': 'Relación',
    'methylationInformation.infoPopup.genes': 'Genes relacionados con este sitio de metilación y las regiones donde se encuentra. Estas regiones, según la base de datos NCBI RefSeq, pueden ser: 5UTR=5\' región no traducida entre el sitio de inicio de transcripción (TTS) y el sitio de inicio ATG, 3UTR=3\' región no traducida entre el codón de parada y la señal poli A, exon_#, TSS200=1-200 pb 5\' del TSS, o TS1500=200-1500 pb 5\' del TSS',
    'methylationInformation.header.genes': 'Genes relacionados',
    'methylationInformation.table.gene': 'Gen',
    'methylationInformation.table.regions': 'Regiones',
    // 18.CurrentMoleculeDetails.tsx
    'currentMoleculeDetails.noSelection': 'Ninguna molécula seleccionada',
    'currentMoleculeDetails.selectOne': 'Selecciona una en el panel izquierdo',
    //  19.MoleculesDetailsMenu.tsx
    'moleculesDetailsMenu.details.info': 'Detalles de {identifier} obtenidos de diferentes fuentes estandarizadas',
    'moleculesDetailsMenu.geneAssociations': 'Red de asociaciones génicas',
    'moleculesDetailsMenu.geneAssociations.info': 'Muestra la red de asociaciones génicas de los genes de este biomarcador',
    'moleculesDetailsMenu.geneOntology': 'Ontología génica',
    'moleculesDetailsMenu.geneOntology.info': 'La Ontología Génica (GO) es una herramienta poderosa para comprender los procesos biológicos, funciones moleculares y componentes celulares asociados a un gen',
    'moleculesDetailsMenu.diseases': 'Enfermedades',
    'moleculesDetailsMenu.diseases.info': 'Interacciones de la molécula con enfermedades reportadas en la literatura',
    'moleculesDetailsMenu.drugs': 'Fármacos',
    'moleculesDetailsMenu.drugs.info': 'Interacciones de la molécula con fármacos reportadas en la literatura',
    'moleculesDetailsMenu.miRNAGeneInteractions': 'Interacciones miRNA-Gen',
    'moleculesDetailsMenu.miRNAGeneInteractions.info': 'Diferentes interacciones miRNA-Gen reportadas en la literatura junto con el puntaje mirDIP y fuentes de PubMed',
    // 20.MoleculesTable.tsx
    'moleculesTable.type.mrna': 'mRNA',
    'moleculesTable.type.mirna': 'miRNA',
    'moleculesTable.type.cna': 'CNA',
    'moleculesTable.type.methylation': 'Metilación',
    'moleculesTable.header.identifier': 'Identificador',
    'moleculesTable.header.type': 'Tipo',
    'moleculesTable.header.actions': 'Acciones',
    'moleculesTable.search.label': 'Muestra',
    // 21.SamplesAndGroupsTable.tsx
    'samplesAndGroupsTable.header.sample': 'Muestra',
    'samplesAndGroupsTable.filter.cluster.placeholder': 'Filtrar por cluster',
    'samplesAndGroupsTable.search.label': 'Muestra',
    // 22.StatisticalValidationResultBestFeatures.tsx
    'statValidationBestFeatures.axis.molecule': 'Molécula',
    'statValidationBestFeatures.context.features': 'características significativas para esta validación estadística',
    // 23.StatisticalValidationResultKaplanMeier.tsx
    'kaplanMeier.axis.time': 'Tiempo',
    'kaplanMeier.axis.probability': 'Probabilidad',
    'kaplanMeier.info.coxRegression': 'Estas métricas se calculan usando Cox-Regression',
    'kaplanMeier.header.clusteringMetrics': 'Métricas de clustering',
    'kaplanMeier.button.clusteringModel': 'Modelo de clustering',
    'kaplanMeier.button.groupByClinical': 'Agrupar por atributo clínico',
    'kaplanMeier.select.clinicalAttribute': 'Atributo clínico para agrupar',
    'kaplanMeier.metric.cIndex': 'Índice C',
    'kaplanMeier.metric.partialLogLikelihood': 'Log-verosimilitud parcial',
    'kaplanMeier.button.seeSamplesAndClusters': 'Ver muestras y clusters',
    'kaplanMeier.modal.samplesAndClusters': 'Muestras y clusters',
    // 24.StatisticalValidationResultMetrics.tsx
    'statValidationMetrics.header.metrics': 'métricas',
    'statValidationMetrics.header.validationMetrics': 'Métricas de validación',
    'statValidationMetrics.metric.mse': 'MSE',
    'statValidationMetrics.metric.r2Score': 'Puntaje R2',
    'statValidationMetrics.header.model': 'Modelo',
    // 25.NewStatisticalValidationModal.tsx
    'newStatValidation.header.create': 'Crear nueva validación estadística',
    'newStatValidation.step.trainedModel': 'Paso 1: Modelo entrenado',
    'newStatValidation.step.validationDatasets': 'Paso 2: Conjuntos de validación',
    // 26.StatisticalValidationMenu.tsx
    'statValidationMenu.bestFeatures': 'Características más significativas',
    'statValidationMenu.bestFeatures.info': 'Características más significativas para el análisis de supervivencia',
    'statValidationMenu.kaplanMeier.info': 'Curva mostrando supervivencia o hazard ratio',
    'statValidationMenu.heatmap': 'Mapa de calor',
    'statValidationMenu.heatmap.info': 'Mapa de calor para cada muestra y molécula',
    // 27.StatisticalValidationsTable.tsx
    'statValidationsTable.stopValidation.header': 'Detener validación estadística',
    'statValidationsTable.stopValidation.confirm': '¿Está seguro de que desea detener la validación estadística {name}?',
    'statValidationsTable.deleteValidation.header': 'Eliminar validación estadística',
    'statValidationsTable.deleteValidation.confirm': '¿Está seguro de que desea eliminar la validación estadística {name}?',
    'statValidationsTable.headerTitle': 'Validaciones estadísticas',
    'statValidationsTable.headers.model': 'Modelo',
    'statValidationsTable.headers.datasets': 'Conjuntos de datos',
    'statValidationsTable.headers.actions': 'Acciones',
    'statValidationsTable.newValidation': 'Nueva validación estadística',
    'statValidationsTable.actions.seeResults': 'Ver resultados',
    'statValidationsTable.actions.stopValidation': 'Detener validación estadística',
    'statValidationsTable.actions.deleteValidation': 'Eliminar validación estadística',
    // 28.NewClusteringModelForm.tsx
    'newClusteringForm.placeholder.algorithm': 'Seleccione un algoritmo',
    'newClusteringForm.label.searchOptimalClusters': 'Buscar el número óptimo de clusters',
    'newClusteringForm.info.nClusters': 'Número de clusters para agrupar los datos. El número óptimo puede encontrarse buscando el codo en la curva de la suma de distancias cuadradas entre muestras y su centro de cluster más cercano.',
    'newClusteringForm.placeholder.metric': 'Seleccione una métrica',
    'newClusteringForm.placeholder.scoringMethod': 'Seleccione un método',
    'newClusteringForm.info.algorithm': 'K-Means: agrupa datos minimizando la varianza intra-cluster; útil para RNA y miRNA. Spectral Clustering: usa similitud basada en grafos para patrones complejos; ideal para metilación y CNA. BK-Means: variación jerárquica de K-Means, adecuada para datasets clínicos y multi-ómicos. Método de Ward: minimiza la varianza en clustering jerárquico; útil para combinar RNA y metilación.',
    'newClusteringForm.info.metric': 'Cox Regression: modelo de riesgos proporcionales para asociaciones entre multi-ómicos y resultados clínicos. Log-Rank Test: prueba no paramétrica para comparar distribuciones de supervivencia; actualmente no disponible.',
    'newClusteringForm.info.scoringMethod': 'C-Index: medida de concordancia entre resultados predichos y observados; valores altos indican mejor desempeño. Log Likelihood: probabilidad de observar los datos dado el modelo; valores bajos indican mejor desempeño.',
    'newClusteringForm.info.randomState': 'Semilla usada por el generador aleatorio para asegurar reproducibilidad.',
    'newClusteringForm.info.penalizer': 'Útil cuando hay pocas muestras o eventos observados; aumenta la robustez del modelo evitando problemas con valores NaN.',
    // 29.NewRFModelForm.tsx
    'newRFForm.label.searchOptimalTrees': 'Buscar el número óptimo de árboles',
    'newRFForm.info.searchOptimalTrees': 'Esta opción es útil cuando el número de muestras en los datos clínicos es pequeño o hay pocos eventos observados; establecer este valor aumenta la robustez del modelo en tales casos, evitando problemas con valores NaN.',
    'newRFForm.label.maxDepth': 'Profundidad máxima',
    'newRFForm.info.maxDepth': 'La profundidad máxima del árbol',
    'newRFForm.info.randomState': 'Semilla utilizada por el generador de números aleatorios',
    'newRFForm.label.nEstimators': 'Número de árboles',
    'newRFForm.info.nEstimators': 'El número de árboles (estimadores) utilizados en el modelo Random Forest.',
    // 30.NewSVMModelForm.tsx
    'newSVMForm.info.kernel.linear': 'Kernel lineal: Mejor para datos linealmente separables; comúnmente usado para clasificación simple de características genómicas o clínicas.',
    'newSVMForm.info.kernel.polynomial': 'Kernel polinomial: Captura patrones no lineales; efectivo para relaciones complejas en datos multi-ómicos.',
    'newSVMForm.info.kernel.rbf': 'Kernel RBF: Mapea los datos a un espacio de mayor dimensión; ideal para manejar separaciones no lineales en análisis de ARN y metilación.',
    'newSVMForm.placeholder.kernel': 'Seleccionar un kernel',
    'newSVMForm.label.maxIterations': 'Iteraciones máximas',
    'newSVMForm.info.maxIterations': 'El número máximo de iteraciones a ejecutar',
    'newSVMForm.info.randomState': 'Semilla utilizada por el generador de números aleatorios',
    // 31.NewTrainedModelModal
    'newTrainedModelModal.header.create': 'Crear nuevo modelo entrenado',

    'newTrainedModelModal.step1.trainingParameters': 'Paso 1: Parámetros de entrenamiento',
    'newTrainedModelModal.step2.trainingDatasets': 'Paso 2: Conjuntos de datos de entrenamiento',

    'newTrainedModelModal.header.selectModel': 'Seleccionar un nuevo modelo para entrenar',
    'newTrainedModelModal.placeholder.selectModel': 'Seleccionar un modelo',
    'newTrainedModelModal.header.selectModelParameters': 'Seleccionar parámetros del modelo',
    'newTrainedModelModal.header.selectCVParameters': 'Seleccionar parámetros de validación cruzada',
    'newTrainedModelModal.info.numberOfFolds': 'Define el número de divisiones de datos para la validación cruzada; asegura una evaluación robusta del modelo y previene el sobreajuste.',
    // 32.BiomarkerTrainedModelsTable
    'biomarkerTrainedModelsTable.header.stopTraining': 'Detener entrenamiento',
    'biomarkerTrainedModelsTable.confirm.stopTraining': '¿Está seguro de que desea detener el entrenamiento del modelo {modelName}?',
    'biomarkerTrainedModelsTable.button.stop': 'Detener',
    'biomarkerTrainedModelsTable.header.deleteBiomarker': 'Eliminar biomarcador',
    'biomarkerTrainedModelsTable.confirm.deleteBiomarker': '¿Está seguro de que desea eliminar el biomarcador {modelName}?',
    'biomarkerTrainedModelsTable.header.trainedModels': 'Modelos entrenados',
    'biomarkerTrainedModelsTable.header.model': 'Modelo',
    'biomarkerTrainedModelsTable.header.bestCVMetric': 'Mejor métrica de validación cruzada',
    'biomarkerTrainedModelsTable.header.datasets': 'Conjuntos de datos',
    'biomarkerTrainedModelsTable.header.actions': 'Acciones',
    'biomarkerTrainedModelsTable.filter.modelType': 'Tipo de modelo',
    'biomarkerTrainedModelsTable.button.newTrainedModel': 'Nuevo modelo entrenado',
    'biomarkerTrainedModelsTable.search.placeholder': 'Buscar por nombre o descripción',
    'biomarkerTrainedModelsTable.button.stopTrainedModel': 'Detener modelo entrenado',
    'biomarkerTrainedModelsTable.button.deleteTrainedModel': 'Eliminar modelo entrenado',
    'biomarkerTrainedModelsTable.button.deleteTrainedModelNotAllowed': 'El modelo entrenado no puede eliminarse porque tiene validaciones estadísticas y/o experimentos de inferencia relacionados',
    // 33.ModelDetailsPanels
    'modelDetails.general.bestFitnessValue': 'Mejor valor de fitness:',
    'modelDetails.svm.task': 'Tarea:',
    'modelDetails.rf.numberOfEstimators': 'Número de estimadores:',
    'modelDetails.rf.maxDepth': 'Profundidad máxima:',
    // 34.BiomarkerStateLabel
    'biomarkerState.completed': 'El experimento está completo',
    'biomarkerState.finishedWithError': 'El experimento terminó con errores. Intenta nuevamente',
    'biomarkerState.waitingForQueue': 'El proceso de este experimento comenzará pronto',
    'biomarkerState.noSamplesInCommon': 'Los datasets no tienen muestras en común',
    'biomarkerState.inProcess': 'El experimento está siendo procesado',
    'biomarkerState.stopping': 'El experimento está siendo detenido',
    'biomarkerState.stopped': 'El experimento fue detenido',
    'biomarkerState.reachedAttemptsLimit': 'El experimento falló varias veces. Cambia algunos parámetros e intenta nuevamente',
    'biomarkerState.noFeaturesFound': 'No se encontraron features. Cambia algunos parámetros e intenta nuevamente',
    'biomarkerState.emptyDataset': 'Después de filtrar valores inválidos como NaN o inf, no quedaron moléculas ni muestras para hacer la inferencia. Quizás las moléculas solicitadas no existen en el dataset, o todos los pacientes contienen datos NaN o inf. Cambia el dataset usado o corrige tus datos e intenta nuevamente.',
    'biomarkerState.noValidMolecules': 'El dataset usado no tiene suficientes moléculas para calcular el experimento (por ejemplo, tiene moléculas diferentes a las especificadas en el Biomarker). Selecciona otro dataset e intenta nuevamente',
    'biomarkerState.numberOfSamplesFewerThanCvFolds': 'Hay menos miembros en cada clase que el número de folds de CrossValidation. Se intentó usar un número menor de splits pero aún así falló. Selecciona un dataset más grande e intenta nuevamente',
    'biomarkerState.timeoutExceeded': 'El análisis alcanzó el límite de tiempo. Cambia algunos parámetros e intenta nuevamente',
    // 35.SVMKernelTask
    'svmTask.regression': 'Regresión',
    'svmTask.ranking': 'Clasificación',
    // 36.TrainedModelStateLabel
    'trainedModelState.completed': 'El experimento está completo{cvModified, select, true { (el número de folds de CrossValidation fue modificado para ser estratificado)} false {}}',
    'trainedModelState.finishedWithError': 'El experimento terminó con errores. Intenta nuevamente',
    'trainedModelState.waitingForQueue': 'El proceso de este experimento comenzará pronto',
    'trainedModelState.noSamplesInCommon': 'Los datasets no tienen muestras en común',
    'trainedModelState.inProcess': 'El experimento está siendo procesado',
    'trainedModelState.stopping': 'El experimento está siendo detenido',
    'trainedModelState.stopped': 'El experimento fue detenido',
    'trainedModelState.reachedAttemptsLimit': 'El experimento falló varias veces. Cambia algunos parámetros e intenta nuevamente',
    'trainedModelState.noFeaturesFound': 'No se encontraron features. Cambia algunos parámetros e intenta nuevamente',
    'trainedModelState.noBestModelFound': 'No se pudo obtener un modelo. Quizás hay menos muestras que el número de folds en la CrossValidation o los datos presentan alta colinealidad. Cambia algunos parámetros como el penalizador o el número de folds en el proceso de CV e intenta nuevamente',
    'trainedModelState.numberOfSamplesFewerThanCvFolds': 'Hay menos miembros en cada clase que el número de folds de CrossValidation. Se intentó usar un número menor de splits pero aún así falló. Selecciona un dataset más grande e intenta nuevamente',
    'trainedModelState.modelDumpNotAvailable': 'El proceso de selección de features terminó correctamente, pero hubo un problema al obtener el modelo. Intenta entrenar un nuevo modelo',
    'trainedModelState.timeoutExceeded': 'El proceso de entrenamiento alcanzó el límite de tiempo. Cambia algunos parámetros e intenta nuevamente',
    'trainedModelState.emptyDataset': 'Después de filtrar valores inválidos como NaN o inf, no quedaron moléculas ni muestras para entrenar el modelo. Quizás las moléculas solicitadas no existen en el dataset, o todos los pacientes contienen datos NaN o inf',
    // 37.BiomarkerTypeSelection
    'biomarkerType.createNew': 'Crear un nuevo Biomarker',
    'biomarkerType.chooseType': 'Elegir tipo de Biomarker',
    'biomarkerType.empty.title': 'Vacío',
    'biomarkerType.empty.description': 'Crear un Biomarker vacío. Luego puedes añadir moléculas o features (genes, microRNAs, metilación de ADN, CNAs) que compondrán el biomarker',
    'biomarkerType.featureSelection.title': 'Selección de features/ML',
    'biomarkerType.featureSelection.description': 'Como punto de partida, puedes seleccionar un Biomarker previamente descubierto, un Biomarker reconocido, o un conjunto de genes que quieras probar. Este método seleccionará el subconjunto molecular que mejor se ajuste a la predicción',
    // 38.BBHAAdvanced
    'bbha.numberOfStars': 'Número de estrellas',
    'bbha.numberOfStars.info': 'Número de estrellas en el Binary Black Hole Algorithm. Cada una de estas estrellas evalúa un subconjunto diferente de features. Aumentar este número incrementa las chances de evaluar el subconjunto más óptimo pero retrasa más el resultado del experimento',
    'bbha.numberOfIterations.info': 'Número de iteraciones en el Binary Black Hole Algorithm. En cada iteración se calcula la función de fitness para cada estrella con su correspondiente subconjunto de features. Aumentar este número permite evaluar más combinaciones de features pero retrasa más el resultado del experimento',
    'bbha.version': 'Versión de BBHA',
    'bbha.version.original': 'El enfoque Original ejecuta el Binary Black Hole Algorithm tal como se definió en',
    'bbha.version.v2': 'La Versión 2 es una versión mejorada definida en este',
    'bbha.coefficientExplanation': 'Coeficiente especificado en el',
    'bbha.useSpark': 'Intentar optimizar usando Apache Spark',
    'bbha.useSpark.info': 'Si esta opción está habilitada, el experimento se ejecutará (si es posible) usando Apache Spark para optimizar los tiempos de ejecución',
    // 39.CoxRegressionAdvanced
    'coxRegression.keepTopN': 'Mantener los N principales',
    'coxRegression.keepTopN.info': 'Número máximo de features que se conservarán después del procesamiento. Las features se ordenan en orden descendente según sus coeficientes, manteniendo primero las más significativas. Si este valor se deja vacío, se conservarán todas aquellas cuyos coeficientes sean distintos de 0',
    // 40.GAAdvanced
    'ga.populationSize': 'Tamaño de la población',
    'ga.populationSize.info': 'Número de soluciones candidatas (individuos o posibles soluciones) que coexisten en cada generación del Genetic Algorithm. Aumentar este número permite evaluar más combinaciones de features pero retrasa más el resultado del experimento',
    'ga.mutationRate': 'Tasa de mutación',
    'ga.floatPlaceholder': 'Un número decimal',
    'ga.mutationRate.info': 'Determina la probabilidad de que un bit (dígito binario) en una solución candidata sea alterado o cambiado aleatoriamente durante el proceso de evolución. Esta opción introduce pequeños cambios aleatorios para explorar nuevas posibilidades.',
    'ga.numberOfIterations.info': 'Número de iteraciones en el Genetic Algorithm. En cada iteración se calcula la función de fitness para cada solución candidata con su correspondiente subconjunto de features. Aumentar este número permite evaluar más combinaciones de features pero retrasa más el resultado del experimento',
    'ga.useSpark': 'Intentar optimizar usando Apache Spark',
    'ga.useSpark.info': 'Si esta opción está habilitada, el experimento se ejecutará (si es posible) usando',
    // 41.ClusteringPanel
    'clustering.algorithm.placeholder': 'Algoritmo de Clustering',
    // 42.RFPanel
    'rf.numberOfEstimators': 'Número de estimadores',
    'rf.maxDepth': 'Profundidad máxima',
    // 43.SVMPanel
    'svm.kernel.placeholder': 'Seleccionar un Kernel',
    // 44.FeatureSelectionForm
    'featureSelection.fitnessFunction': 'Función de fitness',
    'featureSelection.searchOptimalClusters': 'Buscar el número óptimo de clusters (próximamente)',
    'featureSelection.maxIterations': 'Máximo de iteraciones',
    // 45.FeatureSelectionStep1
    'featureSelectionStep1.headerTitle': 'Biomarcadores',
    'featureSelectionStep1.searchPlaceholder': 'Buscar por nombre',
    // 46.FeatureSelectionStep3
    'featureSelectionStep3.blindSearch': 'Búsqueda exhaustiva',
    'featureSelectionStep3.expertMode': 'Modo experto',
    'featureSelectionStep3.geneticAlgorithms': 'Algoritmos genéticos',
    // 47.CrossValidationInput
    'crossValidation.integerPlaceholder': 'Un número entero',
    // 48.FeatureSelectionPanel
    'featureSelectionPanel.tag': 'Etiqueta',
    'featureSelectionPanel.step1': 'Paso 1',
    'featureSelectionPanel.step2': 'Paso 2: Conjuntos de datos',
    'featureSelectionPanel.step3': 'Paso 3: Selección de características',
    'featureSelectionPanel.selectBiomarker': 'Seleccionar biomarcador',
    'featureSelectionPanel.selectedBiomarker': 'Seleccionado {biomarker}',
    // 50.NewBiomarkerForm
    'newBiomarkerForm.newBiomarker': 'Nuevo biomarcador',
    'newBiomarkerForm.cannotEditMolecules': 'No se pueden editar las moléculas',
    'newBiomarkerForm.cannotEditMoleculesDescription': 'Este biomarcador contiene modelos y validaciones asociadas, por lo que sus moléculas no pueden modificarse. Para cambiar sus moléculas, considere clonar este biomarcador y trabajar con su copia.',
    'newBiomarkerForm.selectMolecule': 'Seleccionar molécula',
    'newBiomarkerForm.invalidMoleculesWarning': 'Algunas moléculas (en naranja) de los paneles no fueron encontradas en nuestra base de datos.',
    'newBiomarkerForm.ambiguousMoleculesWarning': 'Hay moléculas ambiguas (en amarillo). Por favor seleccione las apropiadas en los paneles.',
    'newBiomarkerForm.ignoreMoleculesWarnings': 'Ignorar moléculas con advertencias',
    'newBiomarkerForm.ignoreMoleculesInfo': 'Este mensaje no indica un error en sus datos, sino que estas moléculas no fueron encontradas durante la validación. Esto puede deberse a datos desactualizados o diferentes nomenclaturas. Si está seguro de que no hay correcciones por realizar y desea continuar guardando el biomarcador, marque la casilla para habilitar el envío.',
    'newBiomarkerForm.sendForm': 'Enviar formulario',
    'newBiomarkerForm.resetForm': 'Reiniciar formulario',
    'newBiomarkerForm.resetFormDescription': 'Va a reiniciar el formulario y limpiar todos los datos ingresados.',

    // 51.SelectDropDownSingleMolecule
    'selectDropDownSingleMolecule.selectMolecules': 'Seleccionar moléculas',
    'selectDropDownSingleMolecule.noResults': 'Molécula no encontrada',
    'selectDropDownSingleMolecule.ignoreAlias': 'No usar alias propuesto',
    'selectDropDownSingleMolecule.ignoreAliasInfo': 'Si está marcado, la molécula será agregada al biomarcador con el nombre encontrado en la consulta.',
    'selectDropDownSingleMolecule.searchInfo': 'Este motor de búsqueda mostrará moléculas que comiencen con el criterio de búsqueda y, si es necesario, el alias validado encontrado en nuestra base de datos. Este último será agregado al biomarcador. Si desea ingresar la molécula tal como fue encontrada, marque la casilla inferior.',

    // 52.TextAreaMolecules
    'textAreaMolecules.insertMolecules': 'Insertar moléculas',

    // 53.BiomarkerDetailsMenu
    'biomarkerDetailsMenu.moleculesDetails': 'Detalles de moléculas',
    'biomarkerDetailsMenu.moleculesDetailsInfo': 'Detalles de las moléculas que componen el biomarcador',
    'biomarkerDetailsMenu.trainedModels': 'Modelos entrenados',
    'biomarkerDetailsMenu.trainedModelsInfo': 'Panel para listar y entrenar modelos de Machine Learning a partir de información genómica y epigenómica. Estos modelos permiten validación estadística del poder pronóstico/predictivo del biomarcador o inferencia sobre nuevos datos.',
    'biomarkerDetailsMenu.statisticalValidations': 'Validaciones estadísticas',
    'biomarkerDetailsMenu.statisticalValidationsInfo': 'Realizar validaciones estadísticas a partir de modelos de Machine Learning previamente entrenados.',
    'biomarkerDetailsMenu.inference': 'Inferencia',
    'biomarkerDetailsMenu.inferenceInfo': 'Realizar inferencia sobre nuevos datos genómicos y epigenómicos a partir de modelos de Machine Learning previamente entrenados.',
    'biomarkerDetailsMenu.featureSelectionSummary': 'Resumen de selección de características',
    'biomarkerDetailsMenu.featureSelectionSummaryInfo': 'Detalles del proceso de selección de características.',

    // 54.BiomarkerOriginLabel
    'biomarkerOriginLabel.manual': 'Manual',
    'biomarkerOriginLabel.featureSelection': 'Selección de características',

    // 55.SharedInstitutionsBiomarker.tsx
    'sharedInstitutionsBiomarker.header': 'Instituciones compartidas',
    'sharedInstitutionsBiomarker.selectPlaceholder': 'Seleccione una institución para compartir',
    'sharedInstitutionsBiomarker.addInstitution': 'Agregar institución',
    'sharedInstitutionsBiomarker.removeInstitution': 'Eliminar institución',
    'sharedInstitutionsBiomarker.confirm.share.header': 'Compartir biomarcador',
    'sharedInstitutionsBiomarker.confirm.share.content': '¿Está seguro de que desea compartir este biomarcador con la institución seleccionada?',
    'sharedInstitutionsBiomarker.confirm.stopShare.header': 'Dejar de compartir con institución',
    'sharedInstitutionsBiomarker.confirm.stopShare.content': '¿Está seguro de que desea dejar de compartir este biomarcador con esta institución?',
    'sharedInstitutionsBiomarker.users.title': 'Usuarios de {institutionName}',
    'sharedInstitutionsBiomarker.users.column': 'Nombre de usuario',
    'sharedInstitutionsBiomarker.users.searchPlaceholder': 'Buscar por nombre de usuario',

    // 56.SharedUsersBiomarker.tsx
    'sharedUsersBiomarker.header': 'Usuarios compartidos',
    'sharedUsersBiomarker.selectPlaceholder': 'Seleccione un usuario para compartir',
    'sharedUsersBiomarker.addUser': 'Agregar usuario',
    'sharedUsersBiomarker.removeUser': 'Eliminar usuario',
    'sharedUsersBiomarker.confirm.share.header': 'Compartir biomarcador',
    'sharedUsersBiomarker.confirm.share.content': '¿Está seguro de que desea compartir este biomarcador con el usuario seleccionado?',
    'sharedUsersBiomarker.confirm.stopShare.header': 'Dejar de compartir con usuario',
    'sharedUsersBiomarker.confirm.stopShare.content': '¿Está seguro de que desea dejar de compartir este biomarcador con este usuario?',

    // 58.NewCGDSDatasetForm
    'cgdsDatasetForm.filePath.placeholder': 'Ruta del archivo',
    'cgdsDatasetForm.separator.placeholder': 'Seleccionar separador',
    'cgdsDatasetForm.separator.label': 'Separador',
    'cgdsDatasetForm.separator.comma': 'Coma',
    'cgdsDatasetForm.separator.semicolon': 'Punto y coma',
    'cgdsDatasetForm.separator.tab': 'Tabulación',
    'cgdsDatasetForm.separator.colon': 'Dos puntos',
    'cgdsDatasetForm.separator.whitespace': 'Espacio en blanco',
    'cgdsDatasetForm.observation.placeholder': 'Observación',
    'cgdsDatasetForm.headerIndex.placeholder': 'Índice de fila del encabezado (indexado desde 0)',
    'cgdsDatasetForm.headerIndex.help': 'Los índices de fila comienzan desde 0',
    'cgdsDatasetForm.mongoName.placeholder': 'Nombre de la colección de Mongo',
    'cgdsDatasetForm.icon.add': 'Agregar dataset',
    'cgdsDatasetForm.icon.remove': 'Eliminar dataset',

    // 59.NewCGDSStudyForm
    'cgdsStudyForm.header': 'Agregar especificación del estudio CGDS',
    'cgdsStudyForm.url.placeholder': 'URL (tar.gz/zip)',
    'cgdsStudyForm.urlInfo.placeholder': 'URL de información extra',
    'cgdsStudyForm.datasets.header': 'Datasets CGDS',
    'cgdsStudyForm.dataset.methylation': 'Metilación',
    'cgdsStudyForm.dataset.clinicalPatients': 'Pacientes clínicos',
    'cgdsStudyForm.dataset.clinicalSamples': 'Muestras clínicas',
    'cgdsStudyForm.requiredField': 'Campo requerido',
    'cgdsStudyForm.syncWarning': 'Para tener los datos disponibles, debe realizar la sincronización al menos una vez',
    'cgdsStudyForm.addStudy': 'Agregar estudio',
    'cgdsStudyForm.editStudy': 'Editar estudio',

    // 60.BoxplotsCommons
    'boxPlotTooltip.min': 'Mínimo',
    'boxPlotTooltip.firstQuartile': 'Primer cuartil',
    'boxPlotTooltip.median': 'Mediana',
    'boxPlotTooltip.thirdQuartile': 'Tercer cuartil',
    'boxPlotTooltip.max': 'Máximo',
    'boxPlotTooltip.mean': 'Media',
    'boxPlotTooltip.outliers': 'Valores atípicos (usando MAD)',

    // 61.ClusterLabelsSetsModal
    'clusterLabelsSetsModal.header': 'Conjuntos de etiquetas de clúster',
    'clusterLabelsSetsModal.newClusterModel': 'Nuevo modelo de clúster',
    'clusterLabelsSetsModal.searchPlaceholder': 'Buscar por nombre o descripción',

    // 62.NewClusterLabelsSetModal
    'newClusterLabelsSetModal.header': 'Nuevo conjunto de etiquetas de clúster',
    'newClusterLabelsSetModal.labelsHeader': 'Etiquetas',
    'newClusterLabelsSetModal.clusterId': 'ID del clúster',
    'newClusterLabelsSetModal.label': 'Etiqueta',
    'newClusterLabelsSetModal.addLabel': 'Agregar etiqueta',
    'newClusterLabelsSetModal.deleteLabel': 'Eliminar etiqueta',
    'newClusterLabelsSetModal.color': 'Color',

    // 63.NewPredictionRangeLabelsSetModal
    'newPredictionRangeLabelsSetModal.header': 'Nuevos conjuntos de etiquetas de rango de predicción',
    'newPredictionRangeLabelsSetModal.subHeader': 'Nuevo PredictionRangeLabelsSet',
    'newPredictionRangeLabelsSetModal.labelsHeader': 'Etiquetas',
    'newPredictionRangeLabelsSetModal.minValue': 'Valor mínimo',
    'newPredictionRangeLabelsSetModal.maxValue': 'Valor máximo',
    'newPredictionRangeLabelsSetModal.label': 'Etiqueta',
    'newPredictionRangeLabelsSetModal.deleteLabel': 'Eliminar etiqueta',
    'newPredictionRangeLabelsSetModal.addLabel': 'Agregar etiqueta',
    'newPredictionRangeLabelsSetModal.color': 'Color',
    'newPredictionRangeLabelsSetModal.error.maxValue': 'El valor máximo debe ser mayor que el valor mínimo',
    'newPredictionRangeLabelsSetModal.error.overlap': 'Los rangos se superponen con la etiqueta "{label}" (posición {position})',

    // 64.PredictionRangeLabelsSetModal
    'predictionRangeLabelsSetModal.header': 'Conjuntos de etiquetas de rango de predicción',
    'predictionRangeLabelsSetModal.newModel': 'Nuevo conjunto de etiquetas de rango de predicción',
    'predictionRangeLabelsSetModal.searchPlaceholder': 'Buscar por nombre o descripción',

    // 65.PredictionRangeLabelsSetSelect
    'predictionRangeLabelsSetSelect.label': 'Usar una etiqueta de rango',
    'predictionRangeLabelsSetSelect.placeholder': 'Usar etiquetas de rango',

    // 66.EditIcon.tsx
    'common.edit': 'Editar',

    // 67.PaginatedTable.tsx
    'paginatedTable.loading': 'Cargando...',
    'paginatedTable.searchLabel': 'Nombre/Descripción',
    'paginatedTable.entries': 'Entradas',

    // 68.SourceSelectors.tsx
    'sourceSelectors.clinicalProfile': 'Perfil clínico',
    'sourceSelectors.mRNAProfile': 'Perfil mRNA',
    'sourceSelectors.mirnaProfile': 'Perfil miRNA',
    'sourceSelectors.cnaProfile': 'Perfil CNA',
    'sourceSelectors.methylationProfile': 'Perfil de metilación',

    // 69.SwitchPublicButton.tsx
    'switchPublicButton.makePrivate': 'Hacer privado {nameEntity}',
    'switchPublicButton.makePublic': 'Hacer público {nameEntity}',
    'switchPublicButton.confirmMakePrivate': '¿Está seguro de hacer privado {nameEntity}?',
    'switchPublicButton.confirmMakePublic': '¿Está seguro de hacer público {nameEntity}?',

    // 70.TableCellSources.tsx
    'tableCellSources.downloadClinical': 'Descargar archivo clínico fuente',
    'tableCellSources.downloadMrna': 'Descargar archivo fuente mRNA',
    'tableCellSources.downloadMirna': 'Descargar archivo fuente miRNA',
    'tableCellSources.downloadCna': 'Descargar archivo fuente CNA',
    'tableCellSources.downloadMethylation': 'Descargar archivo fuente de metilación',

    // 71.TagForm.tsx
    'tagForm.newTag': 'Nueva etiqueta',

    // 72.TagLabel.tsx
    'tagLabel.noTagAssigned': 'Sin etiqueta asignada',

    // 73.TryAgainSegment.tsx
    'tryAgainSegment.message': 'Algo salió mal, por favor inténtelo nuevamente',
    'tryAgainSegment.button': 'Intentar nuevamente',

    // 74.DifferentialExpressionForm.tsx
    'differentialExpressionForm.header': 'Nueva Expresión Diferencial',
    'differentialExpressionForm.samplesMRNA': 'Muestras mRNA: {count}',
    'differentialExpressionForm.samplesClinical': 'Muestras clínicas: {count}',
    'differentialExpressionForm.samplesInCommon': 'Muestras en común: {count}',
    'differentialExpressionForm.thresholdPercentile': 'Percentil umbral: {value}',
    'differentialExpressionForm.thresholdPercentile.info': 'Umbral percentil para filtrar genes de baja expresión (por defecto 0.15)',
    'differentialExpressionForm.thresholdStd': 'Desviación estándar umbral: {value}',
    'differentialExpressionForm.thresholdStd.info': 'Umbral de varianza para filtrado de genes (por defecto 1e-4)',
    'differentialExpressionForm.top': 'Top: {value}',
    'differentialExpressionForm.top.info': 'Cantidad más significativa de genes a conservar como resultado',
    'differentialExpressionForm.editExperiment': 'Editar experimento',
    'differentialExpressionForm.createExperiment': 'Crear experimento',
    'differentialExpressionForm.cancelEdit': 'Cancelar edición',
    'differentialExpressionForm.resetForm': 'Reiniciar formulario',
    'differentialExpressionForm.successCreated': '¡Experimento de Expresión Diferencial creado exitosamente!',
    'differentialExpressionForm.successUpdated': '¡Experimento de Expresión Diferencial actualizado exitosamente!',
    'differentialExpressionForm.errorCreating': '¡Error al crear el experimento de Expresión Diferencial!',
    'differentialExpressionForm.errorUpdating': '¡Error al actualizar el experimento de Expresión Diferencial!',

    // 75.DifferentialExpressionInputClinicalAttribute.tsx
    'differentialExpressionInputClinicalAttribute.label': 'Agrupar por atributo clínico',
    'differentialExpressionInputClinicalAttribute.placeholder': 'Atributo clínico para agrupar',

    // 76.DifferentialExpressionModalResults.tsx
    'differentialExpressionModalResults.header': 'Resultados del Análisis de Expresión Diferencial - {name}',
    'differentialExpressionModalResults.tab.volcanoPlot': 'Gráfico volcán',

    // 77.DifferentialExpressionModalResultsTableView.tsx
    'diffExpResultsTable.logFoldThreshold': 'Umbral de Log Fold',
    'diffExpResultsTable.headerTitle': 'Resultados de Expresión Diferencial',
    'diffExpResultsTable.noLogFold': 'Sin filtro de Log Fold',
    'diffExpResultsTable.pValueThreshold': 'Umbral de p-value',
    'diffExpResultsTable.noPValue': 'Sin filtro de p-value',
    'diffExpResultsTable.gene': 'Gen',
    'diffExpResultsTable.adjPValue': 'p-value ajustado',
    'diffExpResultsTable.avgExpression': 'Expresión promedio',
    'diffExpResultsTable.bStatistic': 'Estadístico B',
    'diffExpResultsTable.logFoldChange': 'Cambio Log Fold',
    'diffExpResultsTable.pValue': 'p-value',
    'diffExpResultsTable.tStatistic': 'Estadístico t',
    'diffExpResultsTable.downloadCSV': 'Descargar resultados en un archivo CSV',
    'diffExpResultsTable.searchPlaceholder': 'Buscar por gen',

    // 78.DifferentialExpressionModalResultsVolcanoPlot
    'differentialExpression.volcanoPlot.title': 'Gráfico volcán',
    'differentialExpression.volcanoPlot.fcThreshold': 'Umbral |log2FC|',
    'differentialExpression.volcanoPlot.pValueThreshold': 'Umbral de p-value',
    'differentialExpression.volcanoPlot.showThresholds': 'Mostrar umbrales',

    // 79.DifferentialExpressionPanel
    'differentialExpression.panel.noMethod': 'Sin método',
    'differentialExpression.panel.selectMethod': 'Seleccionar un método existente',
    'differentialExpression.panel.method': 'Método',
    'differentialExpression.panel.headerTitle': 'Análisis de Expresión Diferencial',
    'differentialExpression.panel.nameDescription': 'Nombre/Descripción',
    'differentialExpression.panel.searchByNameDescription': 'Buscar por nombre/descripción',
    'differentialExpression.panel.stopSuccess': '¡Experimento de Expresión Diferencial detenido exitosamente!',
    'differentialExpression.panel.stopError': '¡Error al detener el experimento de Expresión Diferencial!',
    'differentialExpression.panel.deleteSuccess': '¡Experimento de Expresión Diferencial eliminado exitosamente!',
    'differentialExpression.panel.deleteError': '¡Error al eliminar el experimento de Expresión Diferencial!',
    'differentialExpression.panel.downloadMrnaSource': 'Descargar archivo fuente mRNA',
    'differentialExpression.panel.downloadClinicalSource': 'Descargar archivo clínico fuente',
    'differentialExpression.panel.publicVisible': 'Todos los usuarios de la plataforma pueden ver este experimento',
    'differentialExpression.panel.publicHidden': 'Si esto está marcado, todos los usuarios de la plataforma pueden ver (pero no editar ni eliminar) este elemento',
    'differentialExpression.panel.seeResults': 'Ver resultados',
    'differentialExpression.panel.stopExperiment': 'Detener experimento',
    'differentialExpression.panel.stopExperimentTitle': 'Detener experimento',
    'differentialExpression.panel.stopExperimentConfirm': '¿Está seguro de detener el experimento?',
    'differentialExpression.panel.deleteExperiment': 'Eliminar experimento',
    // 80.Volcano Plot
    'differentialExpression.volcanoPlot.significant': 'Significativo',
    'differentialExpression.volcanoPlot.notSignificant': 'No significativo',
    'differentialExpression.volcanoPlot.logFoldChange': 'log2(Cambio de expresión)',
    'differentialExpression.volcanoPlot.logPValue': '-log10(p-value)',

    // 81.FAQ
    'faq.pageTitle': 'Preguntas Frecuentes',
    'faq.whatIs.question': '¿Qué es Multiomix?',
    'faq.whatIs.answer': 'Multiomix es una plataforma open-source basada en la nube para investigar eventos genómicos y epigenómicos asociados con la modulación de la expresión génica, con enfoque en el descubrimiento de biomarcadores y el análisis multi-ómico en cáncer. Integra funciones de obtención, agregación, análisis y visualización de datos tanto públicos como cargados por el usuario.',
    'faq.whatIs.link': 'Artículo',
    'faq.analysisTypes.question': '¿Qué tipo de análisis puedo realizar en Multiomix?',
    'faq.analysisTypes.answer': 'Multiomix permite ejecutar análisis de correlación entre mRNA y otras capas ómicas no relacionadas con mRNA, particularmente miRNA, metilación de ADN y CNA. También incluye análisis de supervivencia, validaciones estadísticas, entrenamiento de modelos e inferencia sobre nuevos datasets. En cuanto a biomarcadores, la plataforma permite identificar, gestionar y evaluar firmas compuestas por diferentes variables ómicas, explorar su valor pronóstico o predictivo, entrenar modelos sobre esos biomarcadores y reutilizarlos para validación e inferencia en nuevas cohortes.',
    'faq.pipelines.question': '¿Qué pipelines principales y métodos estadísticos ofrece la plataforma?',
    'faq.pipelines.p1': 'La plataforma proporciona tres pipelines principales: miRNA-mRNA, metilación de ADN-mRNA y CNA-mRNA. En estos flujos de trabajo, los usuarios seleccionan datasets, filtros, método de correlación y ajuste de p-value, luego exploran resultados junto con información clínica y de seguimiento.',
    'faq.pipelines.p2': 'Para correlación, Multiomix soporta Pearson, Spearman y Kendall. Para corrección de pruebas múltiples, soporta Benjamini-Hochberg, Benjamini-Yekutieli y Bonferroni, entre otros. También se incluyen análisis de supervivencia como Kaplan-Meier y Log-rank para estimar el impacto biológico de los eventos detectados.',
    'faq.pipelines.p3': 'Un panel dedicado para gestión, optimización y evaluación de biomarcadores soporta biomarcadores compuestos por mRNA, miRNA, CNA y sitios de metilación. Permite entrenar modelos de clustering, Survival SVM y Random Survival Forest para evaluar el poder pronóstico o predictivo, y reutilizar modelos ya entrenados para nuevas validaciones e inferencias sin necesidad de reentrenarlos desde cero. Para biomarcadores existentes, la plataforma también ofrece optimización mediante múltiples métodos de selección de características.',

    'faq.uploadData.question': '¿Puedo cargar mis propios datos?',
    'faq.uploadData.answer': 'Sí. Multiomix permite cargar datasets propios de manera validada, con verificaciones de formato y consistencia. También ofrece cargas masivas para datasets grandes y una tabla interactiva con filtros, búsqueda, paginación, ordenamiento y etiquetas para gestionar sus datos.',

    'faq.datasetsPublic.question': '¿Multiomix incluye datos públicos listos para usar?',
    'faq.datasetsPublic.answer': 'Sí. La plataforma incluye datasets precargados obtenidos programáticamente desde cBioPortal. Esto permite trabajar con datos públicos y privados en el mismo entorno.',

    'faq.datasetsPreprocessing.question': '¿Cómo se incorporan y preprocesan los datasets de cBioPortal?',
    'faq.datasetsPreprocessing.p1': 'Los datasets de cBioPortal se sincronizan regularmente para garantizar consistencia de datos. Si existe una actualización que no detectamos, los usuarios pueden contactarnos directamente. Las moléculas duplicadas se eliminan para mantener limpio el dataset. Las muestras sin información para una molécula dada en un biomarcador son excluidas de modelos entrenados, validaciones estadísticas, experimentos de selección de características y pasos de inferencia.',
    'faq.datasetsPreprocessing.p2': 'Los datos clínicos también pasan por un preprocesamiento: los casos con valores NaN, vacíos o Null son filtrados. Adicionalmente, los casos con un evento pero con tiempo de supervivencia igual a cero son excluidos (pendiente de aclaración por parte de cBioPortal).',

    'faq.expertise.question': '¿Multiomix es solo para bioinformáticos expertos?',
    'faq.expertise.answer': 'No necesariamente. Multiomix fue diseñado para reducir barreras técnicas y proporcionar una experiencia accesible también para usuarios no expertos, sin sacrificar el rigor analítico. Su objetivo es acercar el descubrimiento de biomarcadores a una gama más amplia de perfiles de investigación mediante una interfaz amigable, documentación clara y guías de uso, dentro de un enfoque abierto y orientado a la democratización tecnológica.',

    'faq.performance.question': '¿Qué hace diferente a Multiomix en términos de rendimiento para análisis de correlación?',
    'faq.performance.answer': 'Para análisis de correlación a gran escala, Multiomix desarrolló su propia herramienta llamada GGCA, implementada en Rust para mejorar el rendimiento y el uso de memoria.',

    'faq.metaheuristics.question': '¿Cómo acelera Multiomix la ejecución de metaheurísticas para selección de características?',
    'faq.metaheuristics.answer': 'Multiomix incorpora optimizaciones de computación distribuida sobre Apache Spark para acelerar la evaluación de agentes metaheurísticos en procesos de selección de características. También incluye estrategias de distribución desarrolladas internamente diseñadas para maximizar el uso de recursos disponibles y lograr el mejor rendimiento posible.',
    'faq.metaheuristics.link': 'Fuente',

    'faq.integrations.question': '¿Qué herramientas del ecosistema integra Multiomix?',
    'faq.integrations.answer': 'Multiomix utiliza BioAPI y Modulector para parte de su funcionalidad. Ambas plataformas actúan como capas de abstracción para acceso estandarizado a datos biológicos. BioAPI expone nomenclatura génica, expresión e información de pathways mediante una API REST, mientras que Modulector centraliza datos de miRNA, genes y sitios de metilación, y ofrece servicios relacionados con evidencia y noticias de PubMed.',

    'faq.technologies.question': '¿Qué tecnologías utiliza internamente Multiomix?',
    'faq.technologies.answer': 'Multiomix está construido como una aplicación web en Python/Rust. Utiliza Django en el backend, React con TypeScript en el frontend, PostgreSQL para anotaciones, MongoDB para datasets precargados y Redis/WebSocket para ejecución asíncrona y notificaciones. Celery es utilizado para colas de tareas, con dependencias de Modulector y BioAPI.',

    'faq.privacy.question': '¿Cómo se maneja la privacidad de los datos cargados por el usuario?',
    'faq.privacy.answer': 'Los datos cargados se almacenan de forma segura y solo son accesibles para el usuario que los cargó. Una vez eliminados, los datos se borran permanentemente de nuestros servidores y no pueden recuperarse. Ningún tercero tiene acceso a datos privados de usuarios.',

    'faq.installation.question': '¿Puedo instalar Multiomix localmente?',
    'faq.installation.answer': 'Sí. Multiomix puede desplegarse localmente y su repositorio oficial incluye instrucciones de instalación y desarrollo, así como soporte para despliegues rápidos con Docker e instalación complementaria de BioAPI y Modulector. El proyecto se distribuye bajo la licencia GPL-3.0, la cual promueve transparencia, acceso al código fuente, adaptabilidad a necesidades específicas y colaboración abierta de la comunidad.',

    'faq.licenses.question': 'Librerías y herramientas con licencias',
    'faq.licenses.answer': 'Por razones legales y de transparencia, proporcionamos una lista de librerías y herramientas de terceros utilizadas en esta plataforma, junto con sus respectivas licencias. Esto garantiza cumplimiento y reconocimiento a las contribuciones de la comunidad open-source que impulsa nuestro ecosistema.',

    'faq.footer.links.siteMap': 'Mapa del sitio',
    'faq.footer.links.contact': 'Contáctenos',
    'faq.footer.links.terms': 'Términos y Condiciones',
    'faq.footer.links.privacy': 'Política de Privacidad',

    // 82.FilesManager
    'files.manager.title': 'Administrador de archivos',
    'files.manager.input.label': 'Agregar un nuevo archivo',
    'files.manager.table.name': 'Nombre',
    'files.manager.table.description': 'Descripción',
    'files.manager.table.type': 'Tipo',
    'files.manager.table.date': 'Fecha',
    'files.manager.table.institutions': 'Instituciones',
    'files.manager.table.tag': 'Etiqueta',
    'files.manager.table.public': 'Público',
    'files.manager.table.actions': 'Acciones',

    'files.manager.filter.tag.placeholder': 'Seleccionar etiqueta existente',
    'files.manager.filter.visibility.all': 'Todos',
    'files.manager.filter.visibility.private': 'Privado',
    'files.manager.search.placeholder': 'Buscar por nombre',

    'files.manager.delete.tag.title': 'Eliminar etiqueta',
    'files.manager.delete.tag.confirm': '¿Está seguro de que desea eliminar la etiqueta "{tagName}"?',

    'files.manager.delete.file.title': 'Eliminar archivo',
    'files.manager.delete.file.confirm': '¿Está seguro de que desea eliminar el archivo {fileName}?',
    'files.manager.delete.file.warning.clinical': 'Este archivo será DESVINCULADO de todos los experimentos asociados',
    'files.manager.delete.file.warning.default': 'Todos los experimentos asociados a este archivo serán ELIMINADOS',

    'files.manager.upload.unloadWarning': 'Se está cargando un archivo. Si cierra la pestaña, la carga será cancelada.',

    'files.manager.error.invalidFormat': 'El archivo tiene un formato incorrecto: todas las columnas excepto el índice deben contener datos numéricos',

    'files.manager.tooltip.sharedWith': 'Este dataset está compartido con {list}',
    'files.manager.tooltip.publicVisible': 'Todos los usuarios de la plataforma pueden ver este archivo',
    'files.manager.tooltip.privateVisibility': 'Si esto está marcado, todos los usuarios de la plataforma pueden ver (pero no editar ni eliminar) este elemento',
    'files.manager.tooltip.indexColumn': 'La columna "{columnName}" será utilizada como índice',
    'files.manager.tooltip.edit': 'Editar',
    'files.manager.tooltip.download': 'Descargar archivo',
    'files.manager.tooltip.nanWarning': 'El dataset contiene valores NaN',

    // Agregados
    // BiomarkersPanel
    'biomarkersPanel.stopExperiment.header': 'Detener experimento',
    'biomarkersPanel.stopExperiment.content': '¿Está seguro de que desea detener el experimento {name}?',
    'biomarkersPanel.deleteModal.header': 'Eliminar biomarcador',
    'biomarkersPanel.deleteModal.content': '¿Está seguro de que desea eliminar el biomarcador {name}?',
    'biomarkersPanel.cloneModal.header': 'Clonar biomarcador',
    'biomarkersPanel.cloneModal.content': '¿Está seguro de que desea clonar el biomarcador "{name}"?',
    'biomarkersPanel.cloneModal.button': 'Clonar',

    'biomarkersPanel.table.headerTitle': 'Biomarcadores',
    'biomarkersPanel.table.searchPlaceholder': 'Buscar por nombre',
    'biomarkersPanel.table.column.tag': 'Etiqueta',
    'biomarkersPanel.table.column.origin': 'Origen',
    'biomarkersPanel.table.column.public': 'Público',
    'biomarkersPanel.table.column.shared': 'Compartido',

    'biomarkersPanel.table.addButton.title': 'Agregar nuevo biomarcador',

    'biomarkersPanel.icon.sharedInstitutions': 'Instituciones compartidas',
    'biomarkersPanel.icon.sharedUsers': 'Usuarios compartidos',
    'biomarkersPanel.icon.clone': 'Clonar biomarcador',
    'biomarkersPanel.icon.public': 'Todos los usuarios de la plataforma pueden ver este experimento',
    'biomarkersPanel.icon.notPublic': 'Si esto está marcado, todos los usuarios de la plataforma pueden ver (pero no editar ni eliminar) este elemento',

    'biomarkersPanel.confirmModal.loseData.header': 'Va a perder todos los datos ingresados',
    'biomarkersPanel.confirmModal.loseData.content': '¿Está seguro?',

    'biomarkersPanel.alert.errorCreating': '¡Error al crear biomarcador!',
    'biomarkersPanel.alert.errorEditing': '¡Error al editar biomarcador!',
    'biomarkersPanel.alert.successCreating': 'Biomarcador creado exitosamente',
    'biomarkersPanel.alert.successEditing': 'Biomarcador editado exitosamente',
    'biomarkersPanel.alert.successSubmitting': '¡Experimento enviado!',

    'biomarkersPanel.tags.noTag': 'Sin etiqueta',
    'biomarkersPanel.tags.label': 'Etiqueta',
    'biomarkersPanel.tags.placeholder': 'Seleccionar una etiqueta existente',
}
