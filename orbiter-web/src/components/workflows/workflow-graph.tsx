export function WorkflowGraph() {
    return (
        <div className="flex items-center justify-center h-64 border border-border-subtle border-dashed rounded bg-bg-panel/50">
            <div className="text-center space-y-2">
                <div className="flex items-center gap-4 text-text-dim">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-24 h-10 border border-border-strong rounded bg-bg-panel flex items-center justify-center text-xs text-text-primary">Ingest</div>
                        <div className="w-px h-8 bg-border-strong" />
                    </div>
                    <div className="flex flex-col items-center gap-2 pt-10">
                        <div className="w-24 h-10 border border-border-strong rounded bg-bg-panel flex items-center justify-center text-xs text-text-primary">Analyze</div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-px h-8 bg-border-strong rotate-90" />
                    </div>
                    <div className="flex flex-col items-center gap-2 pt-10">
                        <div className="w-24 h-10 border border-status-active/30 rounded bg-status-active/5 flex items-center justify-center text-xs text-status-active">Resolve</div>
                    </div>
                </div>
                <p className="text-xs text-text-dim mt-4">Read-only Workflow Visualization (Static MVP)</p>
            </div>
        </div>
    )
}
