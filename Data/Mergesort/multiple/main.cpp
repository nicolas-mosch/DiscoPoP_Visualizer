#include "Mergesort.h"
#include <stdio.h>
using namespace std;

int main(){
	int array[10] = {1, 0, 5, 8, 4, 2, 7, 1, 3, 2};
  Sorter s;
  s.sort(array, 0, 9);
  for(int i = 0; i < 10; i++){
    printf("%d", array[i]);
  }
  return 0;
}
