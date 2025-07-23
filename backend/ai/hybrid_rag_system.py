"""
RevSync HybridRAG System
Combines Vector Retrieval + Graph-Based Retrieval for Advanced Motorcycle ECU Safety Analysis

Features:
- Vector Store: Semantic search for tune documents, safety guides, AFR tables
- Graph Database: Structured relationships (Tune → ECU → Model → Manufacturer → Safety Thresholds)
- Hybrid Query: Combines semantic + relational + contextual understanding
- LLM Integration: Enhanced context for Mistral 7B safety analysis
"""

import os
import json
import logging
import networkx as nx
from typing import Dict, List, Tuple, Optional, Any
import numpy as np
from dataclasses import dataclass, asdict
from datetime import datetime

# Vector store and embedding imports
try:
    import chromadb
    from chromadb.config import Settings
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

logger = logging.getLogger(__name__)

@dataclass
class TuneNode:
    """Graph node representing a motorcycle tune"""
    tune_id: str
    name: str
    motorcycle_make: str
    motorcycle_model: str
    motorcycle_year: int
    ecu_type: str
    tune_type: str
    safety_score: float
    afr_range: Tuple[float, float]
    timing_max: float
    rev_limit: int
    creator_level: str
    upload_date: str

@dataclass
class SafetyThreshold:
    """Safety thresholds for specific motorcycle configurations"""
    motorcycle_key: str  # "yamaha_r6_2020"
    safe_afr_min: float
    safe_afr_max: float
    safe_timing_max: float
    safe_rev_limit: int
    warning_afr_min: float
    warning_afr_max: float
    danger_afr_min: float
    danger_afr_max: float

@dataclass
class HybridRAGResult:
    """Combined result from vector + graph retrieval"""
    vector_results: List[Dict]
    graph_context: Dict
    combined_context: str
    confidence_score: float

class RevSyncHybridRAG:
    """
    Advanced HybridRAG system for motorcycle ECU safety analysis
    Combines semantic vector search with structured graph relationships
    """
    
    def __init__(self, chroma_path: str = "backend/data/chroma_db", graph_path: str = "backend/data/tune_graph.json"):
        self.chroma_path = chroma_path
        self.graph_path = graph_path
        
        # Initialize components
        self.tune_graph = nx.DiGraph()  # Directed graph for tune relationships
        self.vector_store = None
        self.embeddings_model = None
        
        # Safety knowledge base
        self.safety_thresholds = {}
        self.manufacturer_warnings = {}
        self.tuning_guides = {}
        
        # Initialize the system
        self._initialize_hybrid_rag()
    
    def _initialize_hybrid_rag(self):
        """Initialize vector store, graph database, and safety knowledge"""
        
        logger.info("Initializing RevSync HybridRAG System...")
        
        # Initialize vector store
        self._initialize_vector_store()
        
        # Initialize graph database
        self._initialize_graph_database()
        
        # Load safety knowledge base
        self._load_safety_knowledge_base()
        
        logger.info("HybridRAG system initialization complete")
    
    def _initialize_vector_store(self):
        """Initialize ChromaDB vector store for semantic search"""
        
        try:
            if not CHROMA_AVAILABLE:
                logger.warning("ChromaDB not available - using fallback vector search")
                return
            
            # Initialize ChromaDB
            os.makedirs(self.chroma_path, exist_ok=True)
            
            self.chroma_client = chromadb.PersistentClient(
                path=self.chroma_path,
                settings=Settings(anonymized_telemetry=False)
            )
            
            # Create collections
            self.tune_collection = self._get_or_create_collection("motorcycle_tunes")
            self.safety_collection = self._get_or_create_collection("safety_guides") 
            self.manufacturer_collection = self._get_or_create_collection("manufacturer_data")
            
            # Initialize embedding model
            if SENTENCE_TRANSFORMERS_AVAILABLE:
                self.embeddings_model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("Vector store initialized with ChromaDB + SentenceTransformers")
            else:
                logger.warning("SentenceTransformers not available - using basic embeddings")
                
        except Exception as e:
            logger.error(f"Vector store initialization failed: {e}")
            self.vector_store = None
    
    def _get_or_create_collection(self, name: str):
        """Get or create a ChromaDB collection"""
        try:
            return self.chroma_client.get_collection(name)
        except:
            return self.chroma_client.create_collection(name)
    
    def _initialize_graph_database(self):
        """Initialize NetworkX graph for structured relationships"""
        
        try:
            # Load existing graph if available
            if os.path.exists(self.graph_path):
                with open(self.graph_path, 'r') as f:
                    graph_data = json.load(f)
                    self.tune_graph = nx.node_link_graph(graph_data)
                logger.info(f"Loaded existing graph with {self.tune_graph.number_of_nodes()} nodes")
            else:
                # Create new graph with initial motorcycle taxonomy
                self._create_initial_graph_structure()
                logger.info("Created new graph database structure")
                
        except Exception as e:
            logger.error(f"Graph database initialization failed: {e}")
            self._create_initial_graph_structure()
    
    def _create_initial_graph_structure(self):
        """Create initial graph structure with motorcycle taxonomy"""
        
        # Manufacturer nodes
        manufacturers = ['Yamaha', 'Honda', 'Kawasaki', 'Suzuki', 'BMW', 'Ducati', 'KTM', 'Aprilia', 'Triumph']
        for manufacturer in manufacturers:
            self.tune_graph.add_node(f"manufacturer_{manufacturer.lower()}", 
                                   type="manufacturer", name=manufacturer)
        
        # Popular motorcycle models with ECU relationships
        motorcycle_models = [
            ('Yamaha', 'YZF-R6', 'yamaha_ecu', 'supersport'),
            ('Yamaha', 'YZF-R1', 'yamaha_ecu', 'supersport'),
            ('Yamaha', 'MT-09', 'yamaha_ecu', 'naked'),
            ('Honda', 'CBR600RR', 'honda_pgm-fi', 'supersport'),
            ('Honda', 'CBR1000RR', 'honda_pgm-fi', 'supersport'),
            ('Kawasaki', 'ZX-6R', 'kawasaki_ecu', 'supersport'),
            ('Kawasaki', 'ZX-10R', 'kawasaki_ecu', 'supersport'),
            ('Suzuki', 'GSX-R600', 'suzuki_ecu', 'supersport'),
            ('Suzuki', 'GSX-R1000', 'suzuki_ecu', 'supersport'),
        ]
        
        for manufacturer, model, ecu_type, category in motorcycle_models:
            model_key = f"{manufacturer.lower()}_{model.lower().replace('-', '_')}"
            
            # Add model node
            self.tune_graph.add_node(f"model_{model_key}", 
                                   type="motorcycle_model",
                                   manufacturer=manufacturer,
                                   model=model,
                                   ecu_type=ecu_type,
                                   category=category)
            
            # Connect to manufacturer
            self.tune_graph.add_edge(f"manufacturer_{manufacturer.lower()}", 
                                   f"model_{model_key}", 
                                   relationship="produces")
        
        # Save initial structure
        self._save_graph()
    
    def add_tune_to_graph(self, tune_node: TuneNode, analysis_result: Dict):
        """Add a new tune to the graph with relationships"""
        
        try:
            tune_id = f"tune_{tune_node.tune_id}"
            model_key = f"{tune_node.motorcycle_make.lower()}_{tune_node.motorcycle_model.lower().replace('-', '_')}"
            model_node = f"model_{model_key}"
            
            # Add tune node
            self.tune_graph.add_node(tune_id, 
                                   type="tune",
                                   **asdict(tune_node))
            
            # Connect to motorcycle model
            if model_node in self.tune_graph:
                self.tune_graph.add_edge(model_node, tune_id, relationship="has_tune")
            
            # Add safety analysis relationships
            safety_score = analysis_result.get('safety_score', 75)
            
            # Create safety category nodes
            if safety_score >= 85:
                safety_category = "safe_tune"
            elif safety_score >= 65:
                safety_category = "moderate_tune" 
            else:
                safety_category = "risky_tune"
            
            if safety_category not in self.tune_graph:
                self.tune_graph.add_node(safety_category, type="safety_category")
            
            self.tune_graph.add_edge(tune_id, safety_category, 
                                   relationship="classified_as",
                                   safety_score=safety_score)
            
            # Add AFR and timing relationship nodes
            fuel_analysis = analysis_result.get('fuel_map_analysis', {})
            timing_analysis = analysis_result.get('ignition_timing_analysis', {})
            
            if fuel_analysis.get('overall_safety') == 'DANGEROUS':
                danger_node = "dangerous_afr"
                if danger_node not in self.tune_graph:
                    self.tune_graph.add_node(danger_node, type="safety_risk")
                self.tune_graph.add_edge(tune_id, danger_node, 
                                       relationship="has_risk",
                                       afr_value=fuel_analysis.get('leanest_afr'))
            
            if timing_analysis.get('overall_safety') == 'DANGEROUS':
                timing_risk_node = "dangerous_timing"
                if timing_risk_node not in self.tune_graph:
                    self.tune_graph.add_node(timing_risk_node, type="safety_risk")
                self.tune_graph.add_edge(tune_id, timing_risk_node,
                                       relationship="has_risk", 
                                       timing_value=timing_analysis.get('max_timing_advance'))
            
            # Save updated graph
            self._save_graph()
            
            logger.info(f"Added tune {tune_node.tune_id} to graph with {len(list(self.tune_graph.neighbors(tune_id)))} relationships")
            
        except Exception as e:
            logger.error(f"Failed to add tune to graph: {e}")
    
    def add_tune_to_vector_store(self, tune_data: Dict, structured_ecu_data: Any):
        """Add tune documents to vector store for semantic search"""
        
        try:
            if not self.tune_collection:
                logger.warning("Vector store not available - skipping tune indexing")
                return
            
            tune_id = tune_data.get('id', 'unknown')
            
            # Create comprehensive document for semantic search
            document_content = self._create_tune_document(tune_data, structured_ecu_data)
            
            # Add to vector store
            self.tune_collection.add(
                documents=[document_content],
                ids=[f"tune_{tune_id}"],
                metadatas=[{
                    'tune_id': tune_id,
                    'motorcycle': f"{tune_data.get('motorcycle_make')} {tune_data.get('motorcycle_model')}",
                    'tune_type': tune_data.get('tune_type'),
                    'creator_level': tune_data.get('creator_level'),
                    'category': 'motorcycle_tune'
                }]
            )
            
            logger.info(f"Added tune {tune_id} to vector store")
            
        except Exception as e:
            logger.error(f"Failed to add tune to vector store: {e}")
    
    def _create_tune_document(self, tune_data: Dict, structured_ecu_data: Any) -> str:
        """Create comprehensive document for vector search"""
        
        document_parts = []
        
        # Basic tune information
        document_parts.append(f"Motorcycle: {tune_data.get('motorcycle_make')} {tune_data.get('motorcycle_model')} {tune_data.get('motorcycle_year')}")
        document_parts.append(f"Engine: {tune_data.get('engine_type')}")
        document_parts.append(f"ECU Type: {tune_data.get('ecu_type')}")
        document_parts.append(f"Tune Type: {tune_data.get('tune_type')}")
        
        # Structured ECU data
        if structured_ecu_data and structured_ecu_data.fuel_maps:
            fuel_map = structured_ecu_data.fuel_maps[0]
            all_afr_values = []
            for row in fuel_map.values:
                all_afr_values.extend(row)
            
            min_afr = min(all_afr_values)
            max_afr = max(all_afr_values)
            avg_afr = sum(all_afr_values) / len(all_afr_values)
            
            document_parts.append(f"AFR Range: {min_afr:.1f} to {max_afr:.1f}, Average: {avg_afr:.1f}")
        
        if structured_ecu_data and structured_ecu_data.ignition_maps:
            ignition_map = structured_ecu_data.ignition_maps[0]
            all_timing_values = []
            for row in ignition_map.values:
                all_timing_values.extend(row)
            
            max_timing = max(all_timing_values)
            avg_timing = sum(all_timing_values) / len(all_timing_values)
            
            document_parts.append(f"Timing Advance: Maximum {max_timing:.1f}°, Average: {avg_timing:.1f}°")
        
        if structured_ecu_data and structured_ecu_data.rev_limiter:
            document_parts.append(f"Rev Limiter: {structured_ecu_data.rev_limiter.soft_limit} RPM soft, {structured_ecu_data.rev_limiter.hard_limit} RPM hard")
        
        # Safety characteristics
        document_parts.append(f"Performance Focus: {tune_data.get('performance_focus', 'balanced')}")
        document_parts.append(f"Modifications Required: {tune_data.get('required_modifications', 'none')}")
        
        return " | ".join(document_parts)
    
    def hybrid_search(self, query: str, motorcycle_context: Dict = None, top_k: int = 5) -> HybridRAGResult:
        """
        Perform hybrid search combining vector similarity and graph traversal
        """
        
        try:
            # Vector search for semantic similarity
            vector_results = self._vector_search(query, top_k)
            
            # Graph traversal for structured relationships
            graph_context = self._graph_traversal_search(motorcycle_context, query)
            
            # Combine results
            combined_context = self._combine_search_results(vector_results, graph_context, query)
            
            # Calculate confidence score
            confidence_score = self._calculate_hybrid_confidence(vector_results, graph_context)
            
            return HybridRAGResult(
                vector_results=vector_results,
                graph_context=graph_context,
                combined_context=combined_context,
                confidence_score=confidence_score
            )
            
        except Exception as e:
            logger.error(f"Hybrid search failed: {e}")
            return HybridRAGResult(
                vector_results=[],
                graph_context={},
                combined_context="Search failed - using basic context",
                confidence_score=0.0
            )
    
    def _vector_search(self, query: str, top_k: int) -> List[Dict]:
        """Perform semantic vector search"""
        
        try:
            if not self.tune_collection:
                return []
            
            # Search in tune collection
            results = self.tune_collection.query(
                query_texts=[query],
                n_results=top_k
            )
            
            vector_results = []
            for i, (doc, metadata, distance) in enumerate(zip(
                results['documents'][0], 
                results['metadatas'][0],
                results['distances'][0]
            )):
                vector_results.append({
                    'document': doc,
                    'metadata': metadata,
                    'similarity_score': 1 - distance,  # Convert distance to similarity
                    'rank': i + 1
                })
            
            return vector_results
            
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []
    
    def _graph_traversal_search(self, motorcycle_context: Dict, query: str) -> Dict:
        """Perform graph traversal to find related context"""
        
        try:
            graph_context = {
                'related_models': [],
                'safety_patterns': [],
                'manufacturer_insights': [],
                'similar_tunes': []
            }
            
            if not motorcycle_context:
                return graph_context
            
            # Find motorcycle model in graph
            make = motorcycle_context.get('make', '').lower()
            model = motorcycle_context.get('model', '').lower().replace('-', '_')
            model_key = f"model_{make}_{model}"
            
            if model_key in self.tune_graph:
                # Get related tunes for this model
                related_tunes = []
                for neighbor in self.tune_graph.neighbors(model_key):
                    if self.tune_graph.nodes[neighbor].get('type') == 'tune':
                        tune_data = self.tune_graph.nodes[neighbor]
                        related_tunes.append({
                            'tune_id': tune_data.get('tune_id'),
                            'safety_score': tune_data.get('safety_score'),
                            'afr_range': tune_data.get('afr_range'),
                            'timing_max': tune_data.get('timing_max')
                        })
                
                graph_context['similar_tunes'] = related_tunes[:5]
                
                # Get manufacturer insights
                manufacturer_node = f"manufacturer_{make}"
                if manufacturer_node in self.tune_graph:
                    manufacturer_models = list(self.tune_graph.neighbors(manufacturer_node))
                    graph_context['related_models'] = [
                        self.tune_graph.nodes[model]['model'] 
                        for model in manufacturer_models 
                        if self.tune_graph.nodes[model].get('type') == 'motorcycle_model'
                    ]
            
            # Search for safety patterns based on query content
            if 'afr' in query.lower() or 'lean' in query.lower():
                # Find tunes with AFR issues
                dangerous_afr_nodes = [
                    node for node in self.tune_graph.nodes() 
                    if 'dangerous_afr' in str(node)
                ]
                
                if dangerous_afr_nodes:
                    graph_context['safety_patterns'].append({
                        'type': 'dangerous_afr_pattern',
                        'description': 'Found similar tunes with lean AFR conditions',
                        'count': len(dangerous_afr_nodes)
                    })
            
            if 'timing' in query.lower() or 'advance' in query.lower():
                # Find tunes with timing issues
                timing_risk_nodes = [
                    node for node in self.tune_graph.nodes()
                    if 'dangerous_timing' in str(node)
                ]
                
                if timing_risk_nodes:
                    graph_context['safety_patterns'].append({
                        'type': 'dangerous_timing_pattern',
                        'description': 'Found similar tunes with excessive timing advance',
                        'count': len(timing_risk_nodes)
                    })
            
            return graph_context
            
        except Exception as e:
            logger.error(f"Graph traversal search failed: {e}")
            return {}
    
    def _combine_search_results(self, vector_results: List[Dict], graph_context: Dict, query: str) -> str:
        """Combine vector and graph results into comprehensive context"""
        
        context_parts = []
        
        # Add query context
        context_parts.append(f"HYBRIDRAG ENHANCED CONTEXT FOR: {query}")
        context_parts.append("=" * 60)
        
        # Vector search results
        if vector_results:
            context_parts.append("\n🔍 SEMANTIC SEARCH RESULTS:")
            for i, result in enumerate(vector_results[:3], 1):
                context_parts.append(f"\n{i}. Similar Tune (Similarity: {result['similarity_score']:.3f}):")
                context_parts.append(f"   {result['document']}")
                
                metadata = result['metadata']
                context_parts.append(f"   Motorcycle: {metadata.get('motorcycle')}")
                context_parts.append(f"   Creator Level: {metadata.get('creator_level')}")
        
        # Graph context results
        if graph_context:
            context_parts.append("\n🕸️ GRAPH RELATIONSHIP ANALYSIS:")
            
            # Similar tunes from graph
            similar_tunes = graph_context.get('similar_tunes', [])
            if similar_tunes:
                context_parts.append(f"\n   Similar Tunes for Same Model ({len(similar_tunes)} found):")
                for tune in similar_tunes[:3]:
                    context_parts.append(f"   - Safety Score: {tune.get('safety_score')}, AFR: {tune.get('afr_range')}, Max Timing: {tune.get('timing_max')}°")
            
            # Safety patterns
            safety_patterns = graph_context.get('safety_patterns', [])
            if safety_patterns:
                context_parts.append(f"\n   Safety Pattern Analysis:")
                for pattern in safety_patterns:
                    context_parts.append(f"   - {pattern['description']} ({pattern['count']} instances)")
            
            # Related models
            related_models = graph_context.get('related_models', [])
            if related_models:
                context_parts.append(f"\n   Related Models from Same Manufacturer: {', '.join(related_models[:5])}")
        
        # Safety knowledge integration
        context_parts.append(self._get_safety_knowledge_context(query, graph_context))
        
        return "\n".join(context_parts)
    
    def _get_safety_knowledge_context(self, query: str, graph_context: Dict) -> str:
        """Get relevant safety knowledge based on query and graph context"""
        
        safety_context = ["\n📚 SAFETY KNOWLEDGE BASE:"]
        
        # AFR safety knowledge
        if 'afr' in query.lower() or any('afr' in str(pattern) for pattern in graph_context.get('safety_patterns', [])):
            safety_context.append("\n   AFR Safety Guidelines:")
            safety_context.append("   - Safe Range: 12.5-14.7 (stoichiometric ±1.0)")
            safety_context.append("   - Warning Zone: 11.5-12.5 (rich) or 14.7-15.5 (lean)")
            safety_context.append("   - DANGER: <11.5 (fouling/oil wash) or >15.5 (engine damage/piston melt)")
        
        # Timing safety knowledge
        if 'timing' in query.lower() or any('timing' in str(pattern) for pattern in graph_context.get('safety_patterns', [])):
            safety_context.append("\n   Timing Advance Safety Guidelines:")
            safety_context.append("   - Safe Range: <30° advance for most motorcycles")
            safety_context.append("   - Warning Zone: 30-35° (monitor for knock)")
            safety_context.append("   - DANGER: >35° (high knock risk, potential engine damage)")
        
        # Motorcycle-specific knowledge
        related_models = graph_context.get('related_models', [])
        if related_models:
            safety_context.append(f"\n   Manufacturer-Specific Notes for {', '.join(related_models[:2])}:")
            safety_context.append("   - High-revving engines require conservative timing at peak RPM")
            safety_context.append("   - Track-focused tunes need premium fuel (91+ octane)")
            safety_context.append("   - Monitor EGTs and knock sensors during first rides")
        
        return "\n".join(safety_context)
    
    def _calculate_hybrid_confidence(self, vector_results: List[Dict], graph_context: Dict) -> float:
        """Calculate confidence score for hybrid search results"""
        
        try:
            confidence_factors = []
            
            # Vector search confidence
            if vector_results:
                avg_similarity = sum(r['similarity_score'] for r in vector_results) / len(vector_results)
                confidence_factors.append(avg_similarity * 0.4)  # 40% weight
            
            # Graph context richness
            graph_richness = 0.0
            if graph_context.get('similar_tunes'):
                graph_richness += 0.3
            if graph_context.get('safety_patterns'):
                graph_richness += 0.2
            if graph_context.get('related_models'):
                graph_richness += 0.1
            
            confidence_factors.append(graph_richness * 0.6)  # 60% weight
            
            return min(sum(confidence_factors), 1.0)
            
        except Exception:
            return 0.5  # Default moderate confidence
    
    def _load_safety_knowledge_base(self):
        """Load comprehensive safety knowledge base"""
        
        # Motorcycle-specific safety thresholds
        self.safety_thresholds = {
            'yamaha_r6': SafetyThreshold(
                motorcycle_key='yamaha_r6',
                safe_afr_min=12.8, safe_afr_max=14.5,
                safe_timing_max=28.0, safe_rev_limit=12500,
                warning_afr_min=12.5, warning_afr_max=15.0,
                danger_afr_min=11.5, danger_afr_max=15.5
            ),
            'honda_cbr600rr': SafetyThreshold(
                motorcycle_key='honda_cbr600rr',
                safe_afr_min=12.9, safe_afr_max=14.4,
                safe_timing_max=30.0, safe_rev_limit=13000,
                warning_afr_min=12.6, warning_afr_max=14.8,
                danger_afr_min=11.8, danger_afr_max=15.2
            ),
            'kawasaki_zx10r': SafetyThreshold(
                motorcycle_key='kawasaki_zx10r',
                safe_afr_min=12.7, safe_afr_max=14.3,
                safe_timing_max=32.0, safe_rev_limit=13500,
                warning_afr_min=12.4, warning_afr_max=14.7,
                danger_afr_min=11.5, danger_afr_max=15.0
            )
        }
        
        # Manufacturer warnings
        self.manufacturer_warnings = {
            'yamaha': [
                "R6 engines sensitive to lean conditions above 10,000 RPM",
                "Cross-plane cranks require smooth timing transitions",
                "Monitor oil temperature with aggressive tunes"
            ],
            'honda': [
                "PGM-FI system has built-in knock protection",
                "VTEC engagement points affect timing requirements", 
                "Premium fuel recommended for track tunes"
            ],
            'kawasaki': [
                "High compression engines prone to detonation",
                "Advanced timing maps require premium fuel",
                "Monitor EGT on turbo models"
            ]
        }
    
    def _save_graph(self):
        """Save graph to persistent storage"""
        try:
            os.makedirs(os.path.dirname(self.graph_path), exist_ok=True)
            graph_data = nx.node_link_data(self.tune_graph)
            with open(self.graph_path, 'w') as f:
                json.dump(graph_data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save graph: {e}")
    
    def get_safety_threshold(self, motorcycle_key: str) -> Optional[SafetyThreshold]:
        """Get safety thresholds for specific motorcycle"""
        return self.safety_thresholds.get(motorcycle_key.lower())
    
    def get_manufacturer_warnings(self, manufacturer: str) -> List[str]:
        """Get manufacturer-specific warnings"""
        return self.manufacturer_warnings.get(manufacturer.lower(), [])
    
    def get_graph_stats(self) -> Dict:
        """Get graph database statistics"""
        return {
            'total_nodes': self.tune_graph.number_of_nodes(),
            'total_edges': self.tune_graph.number_of_edges(),
            'tune_nodes': len([n for n in self.tune_graph.nodes() if self.tune_graph.nodes[n].get('type') == 'tune']),
            'model_nodes': len([n for n in self.tune_graph.nodes() if self.tune_graph.nodes[n].get('type') == 'motorcycle_model']),
            'manufacturer_nodes': len([n for n in self.tune_graph.nodes() if self.tune_graph.nodes[n].get('type') == 'manufacturer'])
        } 