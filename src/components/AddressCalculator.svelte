<script lang="ts">
	let address = "";
	let squareFootage: number | null = null;
	let calculationComplete = false;
	
	function calculateArea() {		
		// Simulate a calculation with a random number
		setTimeout(() => {
			squareFootage = Math.floor(Math.random() * 3000) + 1000;
			calculationComplete = true;
		}, 500);
	}
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
	<!-- Address Input Section -->
	<div class="bg-white p-6 rounded-lg shadow-md">
		<h3 class="text-xl font-semibold mb-4">Enter Property Address</h3>
		
		<div class="mb-4">
			<label for="address" class="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
			<input 
				type="text" 
				id="address" 
				bind:value={address} 
				class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
				placeholder="123 Main St, City, State, ZIP"
			/>
		</div>
		
		<button 
			onclick={calculateArea}
			class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
			disabled={address.trim() === ""}
		>
			Calculate Square Footage
		</button>
	</div>
	
	<!-- Map Placeholder -->
	<div class="bg-gray-100 p-6 rounded-lg shadow-md flex flex-col">
		<h3 class="text-xl font-semibold mb-4">Property Map</h3>
		
		<div class="flex-grow bg-gray-200 rounded-md border border-gray-300 flex items-center justify-center min-h-[200px]">
			<div class="text-gray-500 text-center p-4">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
				</svg>
				<p>Map will display here</p>
			</div>
		</div>
	</div>
</div>

<!-- Results Section - Only appears after calculation -->
{#if calculationComplete}
	<div class="mt-8 bg-green-50 border border-green-200 rounded-lg shadow-md p-6 animate-fade-in">
		<h3 class="text-xl font-semibold mb-2 text-green-800">Calculation Results</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<p class="text-gray-700 mb-2"><strong>Address:</strong> {address}</p>
				<p class="text-gray-700"><strong>Calculated Square Footage:</strong> {squareFootage?.toLocaleString() ?? 0} sq ft</p>
			</div>
			<div class="bg-white p-4 rounded-md border border-gray-200">
				<h4 class="font-medium text-gray-700 mb-2">Additional Information</h4>
				<ul class="text-sm text-gray-600 space-y-1">
					<li>• Calculation based on property boundaries</li>
					<li>• Results may vary from official records</li>
				</ul>
			</div>
		</div>
	</div>
{/if}

<style>
	.animate-fade-in {
		animation: fadeIn 0.5s ease-in-out;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style> 