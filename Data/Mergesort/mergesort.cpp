#include "Mergesort.h"

Sorter::Sorter(){

}

void Sorter::merge(int A[], int p, int q, int r){
  int n1 = q - p + 1;
  int n2 = r - q;
  int L[n1 + 1];
  int R[n2 + 1];
  int i = 0;
  int j = 0;
  for(; i < n1; i++){
    L[i] = A[p + i];
  }
  for(; j < n2; j++){
    R[j] = A[q + j + 1];
  }
  L[n1] = INT_MAX;
  R[n2] = INT_MAX;
  i = 0; j = 0;
  for(int k = p; k <= r; k++){
    if(L[i] <= R[j]){
      A[k] = L[i];
      i++;
    }else{
      A[k] = R[j];
      j++;
    }
  }
}

void Sorter::sort(int A[], int p, int r){
  if(p < r){
    int q = floor((p+r)/2);
    sort(A, p, q);
    sort(A, q + 1, r);
    merge(A, p, q, r);
  }
}
