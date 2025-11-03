'use client';

export default function CampaignOrchestrationDemo() {
  return (
    <section className="relative py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Campaign Orchestration Engine
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch AI assemble your complete marketing campaign in real-time, 
            from concept to cross-platform deployment.
          </p>
        </div>

        {/* Demo visualization */}
        <div className="relative bg-white rounded-2xl border border-gray-200 p-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Input Stage */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Input & Analysis
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 rounded-lg border">
                  <div className="text-sm font-medium text-blue-900">Product Brief</div>
                  <div className="text-xs text-blue-700 mt-1">Analyzing market position...</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border">
                  <div className="text-sm font-medium text-green-900">Target Audience</div>
                  <div className="text-xs text-green-700 mt-1">Persona mapping complete</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border">
                  <div className="text-sm font-medium text-purple-900">Brand Guidelines</div>
                  <div className="text-xs text-purple-700 mt-1">Style guide imported</div>
                </div>
              </div>
            </div>

            {/* Processing Stage */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                AI Orchestration
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-orange-50 rounded-lg border">
                  <div className="text-sm font-medium text-orange-900">Content Generation</div>
                  <div className="text-xs text-orange-700 mt-1">Creating hooks & narratives...</div>
                </div>
                <div className="p-4 bg-cyan-50 rounded-lg border">
                  <div className="text-sm font-medium text-cyan-900">Asset Production</div>
                  <div className="text-xs text-cyan-700 mt-1">Generating visuals & copy</div>
                </div>
                <div className="p-4 bg-pink-50 rounded-lg border">
                  <div className="text-sm font-medium text-pink-900">Platform Optimization</div>
                  <div className="text-xs text-pink-700 mt-1">Adapting formats...</div>
                </div>
              </div>
            </div>

            {/* Output Stage */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                Campaign Delivery
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 rounded-lg border">
                  <div className="text-sm font-medium text-emerald-900">TikTok Campaign</div>
                  <div className="text-xs text-emerald-700 mt-1">15 videos ready to deploy</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border">
                  <div className="text-sm font-medium text-blue-900">Instagram Assets</div>
                  <div className="text-xs text-blue-700 mt-1">Stories + Reels + Carousels</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border">
                  <div className="text-sm font-medium text-purple-900">Multi-Platform Suite</div>
                  <div className="text-xs text-purple-700 mt-1">YouTube, X, LinkedIn ready</div>
                </div>
              </div>
            </div>

          </div>

          {/* Flow arrows */}
          <div className="hidden md:block">
            <div className="absolute top-1/2 left-1/3 transform -translate-y-1/2 -translate-x-1/2">
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1 w-0 h-0 border-l-4 border-l-gray-300 border-t-2 border-b-2 border-t-transparent border-b-transparent"></div>
            </div>
            <div className="absolute top-1/2 right-1/3 transform -translate-y-1/2 translate-x-1/2">
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1 w-0 h-0 border-l-4 border-l-gray-300 border-t-2 border-b-2 border-t-transparent border-b-transparent"></div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all"
            aria-label="Experience Campaign Orchestration"
            onClick={() => {
              // Placeholder for future campaign orchestration demo
              console.log('Campaign orchestration demo clicked');
            }}
          >
            Experience Campaign Orchestration
          </button>
        </div>
      </div>
    </section>
  );
}
