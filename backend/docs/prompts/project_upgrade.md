> "Act as a Senior Systems Architect. Your first task is to perform a deep audit of the Orbitr codebase.
> 
>1.  *Graph Mapping:* Visually map out the current LangGraph workflow. Identify every node (Agent), every edge (transition), and explicitly state what data enters and leaves each node.
> 2.  *State Analysis:* Examine the WorkflowState. Is the state object growing too large? Are we passing unnecessary history to the LLM?
> 3.  *Agent Logic:* Review the 'Thick Agents'. Identify where we are relying on Python logic vs. LLM reasoning. Are we asking the LLM to do simple math or date comparisons that Python should handle?
> 4.  *Database Bottlenecks:* Look at how we interact with SQLite. Are we writing too often? Is the schema designed for rapid retrieval of complex audit trails, or is it just a simple log dump?
> 
>*Output:* Provide a summary report highlighting the three biggest architectural weaknesses currently preventing us from scaling or launching a frontend."

> "Act as an AI Engineering Lead. We need to implement strict observability and robust context management.
> 
>1.  *LangSmith Integration:* Configure the environment to fully trace every step of the LangGraph execution. Ensure that every time an agent makes a decision, we capture the 'thought process' (the prompt and the intermediate reasoning) so we can debug it later.
> 2.  *Context Injection Strategy:* We are currently passing raw data to the LLM. Research and implement a better context management strategy. Evaluate using tools like *Ultracontext* (or a similar RAG/vector solution) to retrieve only the relevant compliance policies and historical event data for the specific event being processed.
> 3.  *The 'Reasoning Only' Constraint:* Refactor the system so the LLM is never used for data retrieval or formatting. Use Python to fetch the data (from the context tool) and pass it to the LLM. The LLM's job is strictly to read that context and provide a reasoning-based judgment (Compliance Pass/Fail, Risk Score).
> 
>*Goal:* Eliminate hallucinations by ensuring the LLM is never asked to 'guess' a policy; it must always be provided with the policy via the context tool." 

> We Also Need to implement Guardrails for the LLM to prevent it from making any decisions that are not backed by the context provided. The LLM should be able to refuse to answer if the context is not sufficient to make a decision.