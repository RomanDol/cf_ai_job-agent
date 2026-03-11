// Adzuna API integration for job search

export interface Job {
	title: string;
	company: string;
	location: string;
	salary: string;
	description: string;
	url: string;
}

export async function searchJobs(
	appId: string,
	appKey: string,
	keywords: string,
	location: string = 'london',
	resultsPerPage: number = 10,
): Promise<Job[]> {
	const url = `https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=${resultsPerPage}&what=${encodeURIComponent(keywords)}&where=${encodeURIComponent(location)}`;

	const response = await fetch(url);
	const data = (await response.json()) as { results: any[] };

	return data.results.map((job: any) => ({
		title: job.title,
		company: job.company?.display_name ?? 'Unknown',
		location: job.location?.display_name ?? location,
		salary: job.salary_min ? `£${job.salary_min} - £${job.salary_max}` : 'Not specified',
		description: job.description,
		url: job.redirect_url,
	}));
}
