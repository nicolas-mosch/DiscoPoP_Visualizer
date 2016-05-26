#include <cmath>
#include <climits>

class Sorter
{
public:
	Sorter();
	void sort(int A[], int p, int r);
private:
	void merge(int A[], int p, int q, int r);
};
